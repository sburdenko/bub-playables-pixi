/**
 * How each sprite in `assets-src/` ships. The folder a sprite lives in is its group (`hero/smash2.png` → `hero`);
 * every group must have a rule, so shipping an asset is always an explicit decision.
 */
export type GroupRule = {
  readonly output: AtlasOutput | SingleOutput;
  /** Uniform resize factor. Pixels-per-unit is scaled by the same factor, so on-screen size is unchanged. */
  readonly scale: number;
  /** Removes transparent margins; only for sprites with a transparent background. */
  readonly isTrimmed: boolean;
  /** Per-sprite scale for large sources in an otherwise small-sprite group; first match wins. */
  readonly scaleOverrides?: readonly { readonly match: RegExp; readonly scale: number }[];
};

export type AtlasOutput = { readonly kind: 'atlas'; readonly atlas: string };

export type SingleOutput = { readonly kind: 'single'; readonly format: 'jpeg' | 'png' };

/**
 * WebP is much smaller for painted art with soft alpha (characters, bubbles); palette PNG stays smaller and exact for
 * tiny flat sprites and additive glows, where lossy artifacts show.
 */
export type AtlasEncoding =
  | { readonly format: 'webp'; readonly quality: number; readonly alphaQuality: number }
  | { readonly format: 'png'; readonly paletteQuality: number | null };

export type AtlasSettings = { readonly maxSize: number; readonly padding: number; readonly encoding: AtlasEncoding };

export type SpriteRule = Omit<GroupRule, 'scaleOverrides'>;

const atlas = (name: string): AtlasOutput => ({ kind: 'atlas', atlas: name });
const WEBP: AtlasEncoding = { format: 'webp', quality: 85, alphaQuality: 90 };
const PALETTE_PNG: AtlasEncoding = { format: 'png', paletteQuality: 95 };

export const ATLAS_SETTINGS: Readonly<Record<string, AtlasSettings>> = {
  hero: { maxSize: 2048, padding: 2, encoding: WEBP },
  enemy: { maxSize: 2048, padding: 2, encoding: WEBP },
  bubbles: { maxSize: 2048, padding: 2, encoding: WEBP },
  ui: { maxSize: 2048, padding: 2, encoding: WEBP },
  frame: { maxSize: 2048, padding: 2, encoding: PALETTE_PNG },
  vfx: { maxSize: 1024, padding: 2, encoding: PALETTE_PNG },
};

export const GROUP_RULES: Readonly<Record<string, GroupRule>> = {
  single: { output: { kind: 'single', format: 'jpeg' }, scale: 1, isTrimmed: false },
  frame: { output: atlas('frame'), scale: 0.45, isTrimmed: false },
  ui: { output: atlas('ui'), scale: 1, isTrimmed: false, scaleOverrides: [{ match: /^gameplaybottomblue$/, scale: 0.5 }] },
  hero: { output: atlas('hero'), scale: 0.4, isTrimmed: true },
  enemy: { output: atlas('enemy'), scale: 0.4, isTrimmed: true },
  bubbles: {
    output: atlas('bubbles'),
    scale: 0.5,
    isTrimmed: true,
    scaleOverrides: [{ match: /^t-normal-(red|blue|green|yellow|shadow|outline)$/, scale: 0.4 }],
  },
  vfx: {
    output: atlas('vfx'),
    scale: 1,
    isTrimmed: false,
    scaleOverrides: [{ match: /^(t-ui-vfx-upgrade-vfx02|t-circle-sq-02-\d)$/, scale: 0.5 }],
  },
};

/** Group of a sprite: the first folder of its path inside `assets-src/`. */
export function groupOf(file: string): string {
  const [group] = file.split('/');

  return group ?? '';
}

export function ruleFor(sprite: { readonly id: string; readonly file: string }, rules = GROUP_RULES): SpriteRule {
  const group = groupOf(sprite.file);
  const rule = rules[group];
  if (rule === undefined) {
    throw new Error(`Sprite '${sprite.id}' is in folder '${group}/', which has no rule. Add one to GROUP_RULES in tools/assets/rules.ts.`);
  }

  const override = rule.scaleOverrides?.find((candidate) => candidate.match.test(sprite.id));

  return { output: rule.output, scale: override?.scale ?? rule.scale, isTrimmed: rule.isTrimmed };
}
