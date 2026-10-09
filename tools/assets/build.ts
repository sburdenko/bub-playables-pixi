import { copyFileSync, mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { ASSET_GROUP_BUDGETS_KB, base64Size } from '../size/budget';
import { layoutAtlas } from './atlasLayout';
import { renderManifestModule, type ManifestAtlas, type ManifestFont, type ManifestTexture } from './manifestModule';
import { ATLAS_SETTINGS, ruleFor, type AtlasEncoding, type SpriteRule } from './rules';
import { readCatalog, SOURCE_DIRECTORY, type SourceCatalog, type SourceSprite } from './sourceCatalog';
import { alphaBounds, scaleSprite } from './spriteMath';
import { buildSpritesheet, type ProcessedSprite } from './spritesheetJson';

const OUTPUT_DIRECTORY = 'src/generated';
const STAGING_DIRECTORY = `${OUTPUT_DIRECTORY}.staging`;
const JPEG_QUALITY = 82;

type ProcessedImage = ProcessedSprite & { readonly buffer: Buffer; readonly pixelsPerUnit: number };

type BuiltFile = { readonly file: string; readonly group: string };

type Built<T> = {
  readonly entry: T;
  readonly files: readonly BuiltFile[];
  readonly pixelsPerUnit: readonly (readonly [string, number])[];
};

/** Builds atlases, textures, fonts and the manifest module; the previous output is replaced only on success. */
async function main(): Promise<void> {
  const catalog = readCatalog();
  rmSync(STAGING_DIRECTORY, { recursive: true, force: true });
  ['atlases', 'textures', 'fonts'].forEach((folder) => mkdirSync(path.join(STAGING_DIRECTORY, folder), { recursive: true }));

  const { atlasSprites, singleSprites } = splitByOutput(catalog.sprites);
  const atlases = await Promise.all([...atlasSprites].map(([name, sprites]) => buildAtlas(name, sprites)));
  const textures = await Promise.all(singleSprites.map(buildSingle));
  const fonts = catalog.fonts.map(copyFont);
  const pixelsPerUnit = Object.fromEntries([...atlases, ...textures].flatMap((built) => built.pixelsPerUnit));

  writeFileSync(
    path.join(STAGING_DIRECTORY, 'assets.ts'),
    renderManifestModule({
      atlases: atlases.map((built) => built.entry),
      textures: textures.map((built) => built.entry),
      fonts: fonts.map((built) => built.entry),
      pixelsPerUnit,
      aliases: catalog.aliases,
    }),
  );
  reportSizes([...atlases, ...textures, ...fonts].flatMap((built) => built.files));
  rmSync(OUTPUT_DIRECTORY, { recursive: true, force: true });
  renameSync(STAGING_DIRECTORY, OUTPUT_DIRECTORY);
}

function splitByOutput(sprites: SourceCatalog['sprites']) {
  const atlasSprites = new Map<string, SourceSprite[]>();
  const singleSprites: SourceSprite[] = [];
  for (const sprite of [...sprites].sort((left, right) => left.id.localeCompare(right.id))) {
    const { output } = ruleFor(sprite);
    if (output.kind === 'atlas') {
      atlasSprites.set(output.atlas, [...(atlasSprites.get(output.atlas) ?? []), sprite]);
    } else {
      singleSprites.push(sprite);
    }
  }

  return { atlasSprites: new Map([...atlasSprites].sort(([left], [right]) => left.localeCompare(right))), singleSprites };
}

async function processSprite(sprite: SourceSprite, rule: SpriteRule): Promise<ProcessedImage> {
  const scaled = scaleSprite(sprite.width, sprite.height, rule.scale, sprite.pixelsPerUnit, sprite.borders);
  const resized = await sharp(path.join(SOURCE_DIRECTORY, sprite.file))
    .resize(scaled.width, scaled.height, { fit: 'fill', kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = rule.isTrimmed ? alphaBounds(resized.data, scaled.width, scaled.height) : null;
  const trim = bounds ?? { x: 0, y: 0, width: scaled.width, height: scaled.height };
  const buffer = await sharp(resized.data, { raw: { width: scaled.width, height: scaled.height, channels: 4 } })
    .extract({ left: trim.x, top: trim.y, width: trim.width, height: trim.height })
    .png()
    .toBuffer();

  return {
    id: sprite.id,
    buffer,
    sourceWidth: scaled.width,
    sourceHeight: scaled.height,
    trim,
    anchor: sprite.anchor,
    borders: scaled.borders,
    pixelsPerUnit: scaled.pixelsPerUnit,
  };
}

async function buildAtlas(name: string, sprites: readonly SourceSprite[]): Promise<Built<ManifestAtlas>> {
  const settings = ATLAS_SETTINGS[name];
  if (settings === undefined) {
    throw new Error(`Atlas '${name}' has no entry in ATLAS_SETTINGS (tools/assets/rules.ts).`);
  }

  const images = await Promise.all(sprites.map((sprite) => processSprite(sprite, ruleFor(sprite))));
  const byId = new Map(images.map((image) => [image.id, image]));
  const pages = layoutAtlas(images.map((image) => ({ id: image.id, width: image.trim.width, height: image.trim.height })), settings.maxSize, settings.padding);
  const written = await Promise.all(
    pages.map(async (page, index) => {
      const image = `atlases/${name}-${index}.${settings.encoding.format}`;
      const data = `atlases/${name}-${index}.json`;
      const composites = page.placements.map((placement) => ({ input: byId.get(placement.id)?.buffer ?? Buffer.alloc(0), left: placement.x, top: placement.y }));
      const canvas = sharp({ create: { width: page.width, height: page.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(composites);
      await encode(canvas, settings.encoding).toFile(path.join(STAGING_DIRECTORY, image));
      writeFileSync(path.join(STAGING_DIRECTORY, data), JSON.stringify(buildSpritesheet(page, path.basename(image), byId)));

      return { image, data };
    }),
  );

  return {
    entry: { name, pages: written },
    files: written.flatMap((page) => [{ file: page.image, group: name }, { file: page.data, group: name }]),
    pixelsPerUnit: images.map((image) => [image.id, image.pixelsPerUnit] as const),
  };
}

function encode(image: Sharp, encoding: AtlasEncoding): Sharp {
  if (encoding.format === 'webp') {
    return image.webp({ quality: encoding.quality, alphaQuality: encoding.alphaQuality, effort: 6 });
  }

  return encoding.paletteQuality === null
    ? image.png({ compressionLevel: 9 })
    : image.png({ palette: true, quality: encoding.paletteQuality, effort: 10, compressionLevel: 9 });
}

async function buildSingle(sprite: SourceSprite): Promise<Built<ManifestTexture>> {
  const rule = ruleFor(sprite);
  const image = await processSprite(sprite, rule);
  const { isOpaque } = await sharp(image.buffer).stats();
  const wantsJpeg = rule.output.kind === 'single' && rule.output.format === 'jpeg';
  if (wantsJpeg && !isOpaque) {
    console.warn(`'${sprite.id}' has transparency; writing PNG instead of JPEG.`);
  }

  const isJpeg = wantsJpeg && isOpaque;
  const file = `textures/${sprite.id}.${isJpeg ? 'jpg' : 'png'}`;
  const encoder = sharp(image.buffer);
  await (isJpeg ? encoder.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }) : encoder.png({ compressionLevel: 9 })).toFile(path.join(STAGING_DIRECTORY, file));

  return {
    entry: { id: sprite.id, image: file, anchor: sprite.anchor },
    files: [{ file, group: sprite.id }],
    pixelsPerUnit: [[sprite.id, image.pixelsPerUnit] as const],
  };
}

function copyFont(font: SourceCatalog['fonts'][number]): Built<ManifestFont> {
  const file = `fonts/${path.basename(font.file)}`;
  copyFileSync(path.join(SOURCE_DIRECTORY, font.file), path.join(STAGING_DIRECTORY, file));

  return { entry: { family: font.family, file }, files: [{ file, group: 'font' }], pixelsPerUnit: [] };
}

function reportSizes(builtFiles: readonly BuiltFile[]): void {
  const totals = builtFiles.reduce(
    (sums, built) => new Map(sums).set(built.group, (sums.get(built.group) ?? 0) + statSync(path.join(STAGING_DIRECTORY, built.file)).size),
    new Map<string, number>(),
  );
  const rows = [...totals].sort(([, left], [, right]) => right - left);
  const total = rows.reduce((sum, [, bytes]) => sum + bytes, 0);
  writeFileSync(path.join(STAGING_DIRECTORY, 'asset-report.json'), `${JSON.stringify({ totalBytes: total, groups: Object.fromEntries(rows) }, null, 2)}\n`);

  console.log('Asset group          size     budget');
  for (const [group, bytes] of rows) {
    const budget = ASSET_GROUP_BUDGETS_KB[group];
    const flag = budget !== undefined && bytes / 1024 > budget ? '  ⚠ over budget' : '';
    console.log(`${group.padEnd(18)} ${kb(bytes).padStart(9)}  ${budget === undefined ? '—' : `${budget} KB`}${flag}`);
  }

  console.log(`${'total'.padEnd(18)} ${kb(total).padStart(9)}  (≈${kb(base64Size(total))} as base64)`);
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

main().catch((error: unknown) => {
  rmSync(STAGING_DIRECTORY, { recursive: true, force: true });
  console.error(error);
  process.exitCode = 1;
});
