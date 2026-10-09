import { readFileSync } from 'node:fs';

export const SOURCE_DIRECTORY = 'assets-src';
export const CATALOG_FILE = `${SOURCE_DIRECTORY}/catalog.json`;

/** One sprite in `assets-src/` with what the runtime needs to size and anchor it. Its folder is its group. */
export type SourceSprite = {
  readonly id: string;
  /** Path relative to `assets-src/`; the first folder is the group that decides how it ships. */
  readonly file: string;
  /** Where the art came from (source file, artist); informational only. */
  readonly origin?: string;
  readonly width: number;
  readonly height: number;
  readonly pixelsPerUnit: number;
  /** Pixi anchor, 0..1 from the top-left corner. */
  readonly anchor: { readonly x: number; readonly y: number };
  /** Nine-slice borders in source pixels; all zero when the sprite is not sliced. */
  readonly borders: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };
};

export type SourceFont = { readonly id: string; readonly file: string; readonly family: string };

export type SourceCatalog = {
  readonly sprites: readonly SourceSprite[];
  readonly fonts: readonly SourceFont[];
  /** Old ids that keep working after their sprite was replaced by another one. */
  readonly aliases: Readonly<Record<string, string>>;
};

export function readCatalog(file = CATALOG_FILE): SourceCatalog {
  const catalog: unknown = JSON.parse(readFileSync(file, 'utf8'));
  validateCatalog(catalog);

  return catalog;
}

/** Checks the shape of untrusted catalog JSON; throws with the first problem found. */
export function validateCatalog(catalog: unknown): asserts catalog is SourceCatalog {
  const candidate = catalog as Partial<Record<keyof SourceCatalog, unknown>> | null;
  if (candidate === null || !Array.isArray(candidate.sprites) || !Array.isArray(candidate.fonts) || typeof candidate.aliases !== 'object' || candidate.aliases === null) {
    throw new Error(`${CATALOG_FILE} must contain "sprites", "fonts" and "aliases". Run "npm run assets:import".`);
  }

  candidate.sprites.forEach(validateSprite);
  const ids = new Set<string>();
  for (const entry of [...candidate.sprites, ...candidate.fonts] as { id: string }[]) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate asset id '${entry.id}' in ${CATALOG_FILE}.`);
    }

    ids.add(entry.id);
  }

  for (const [alias, target] of Object.entries(candidate.aliases)) {
    if (typeof target !== 'string' || !ids.has(target) || ids.has(alias)) {
      throw new Error(`Alias '${alias}' → '${String(target)}' in ${CATALOG_FILE} must point from an unused id to an existing one.`);
    }
  }
}

function validateSprite(value: unknown): void {
  const sprite = value as Partial<Record<keyof SourceSprite, unknown>>;
  const isNumber = (field: unknown) => typeof field === 'number' && Number.isFinite(field);
  const isPoint = (field: unknown) => typeof field === 'object' && field !== null && isNumber((field as { x?: unknown }).x) && isNumber((field as { y?: unknown }).y);
  const isValid =
    typeof sprite.id === 'string' &&
    typeof sprite.file === 'string' &&
    (sprite.origin === undefined || typeof sprite.origin === 'string') &&
    [sprite.width, sprite.height, sprite.pixelsPerUnit].every(isNumber) &&
    isPoint(sprite.anchor) &&
    typeof sprite.borders === 'object' &&
    sprite.borders !== null;
  if (!isValid) {
    throw new Error(`Malformed sprite entry in ${CATALOG_FILE}: ${JSON.stringify(value)}`);
  }
}
