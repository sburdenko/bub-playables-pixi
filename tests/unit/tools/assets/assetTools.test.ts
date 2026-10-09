import { describe, expect, it } from 'vitest';
import { layoutAtlas } from '../../../../tools/assets/atlasLayout';
import { renderManifestModule } from '../../../../tools/assets/manifestModule';
import { GROUP_RULES, groupOf, ruleFor } from '../../../../tools/assets/rules';
import { validateCatalog, type SourceSprite } from '../../../../tools/assets/sourceCatalog';
import { buildSpritesheet, type ProcessedSprite } from '../../../../tools/assets/spritesheetJson';

describe('asset rules', () => {
  it('theFolderIsTheGroup', () => {
    expect(groupOf('hero/smash2.png')).toBe('hero');
    expect(ruleFor({ id: 'smash2', file: 'hero/smash2.png' })).toEqual({ output: { kind: 'atlas', atlas: 'hero' }, scale: 0.4, isTrimmed: true });
  });

  it('perSpriteOverrideBeatsTheGroupScale', () => {
    expect(ruleFor({ id: 'gameplaybottomblue', file: 'ui/gameplaybottomblue.png' }).scale).toBe(0.5);
    expect(ruleFor({ id: 'gameplayframetop', file: 'ui/gameplayframetop.png' }).scale).toBe(1);
  });

  it('folderWithoutARuleFailsLoudly', () => {
    expect(() => ruleFor({ id: 'x', file: 'mystery/x.png' })).toThrow(/folder 'mystery\/', which has no rule/);
  });

  it('everyRuleShrinksOrKeepsSize', () => {
    expect(Object.values(GROUP_RULES).every((rule) => rule.scale > 0 && rule.scale <= 1)).toBe(true);
  });
});

describe('layoutAtlas', () => {
  it('placesEverySpriteWithoutOverlap', () => {
    const inputs = [
      { id: 'a', width: 100, height: 50 },
      { id: 'b', width: 60, height: 60 },
      { id: 'c', width: 30, height: 30 },
    ];
    const [page] = layoutAtlas(inputs, 256, 2);
    const boxes = (page?.placements ?? []).map((placement) => {
      const input = inputs.find((candidate) => candidate.id === placement.id);

      return { ...placement, right: placement.x + (input?.width ?? 0), bottom: placement.y + (input?.height ?? 0) };
    });

    expect(boxes.map((box) => box.id).sort()).toEqual(['a', 'b', 'c']);
    for (const left of boxes) {
      for (const right of boxes.filter((box) => box !== left)) {
        const overlaps = left.x < right.right && right.x < left.right && left.y < right.bottom && right.y < left.bottom;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('spillsToMorePagesWhenFull', () => {
    const pages = layoutAtlas([{ id: 'a', width: 90, height: 90 }, { id: 'b', width: 90, height: 90 }], 100, 2);

    expect(pages).toHaveLength(2);
  });

  it('rejectsSpritesLargerThanAPage', () => {
    expect(() => layoutAtlas([{ id: 'huge', width: 300, height: 10 }], 256, 2)).toThrow(/exceeds the 256px atlas/);
  });
});

describe('buildSpritesheet', () => {
  const sprite: ProcessedSprite = {
    id: 'body',
    sourceWidth: 100,
    sourceHeight: 80,
    trim: { x: 10, y: 5, width: 70, height: 60 },
    anchor: { x: 0.5, y: 0.5 },
    borders: { left: 0, top: 0, right: 0, bottom: 0 },
  };

  it('writesTrimAndAnchorTheWayPixiExpects', () => {
    const sheet = buildSpritesheet({ width: 128, height: 128, placements: [{ id: 'body', x: 4, y: 6 }] }, 'a.png', new Map([['body', sprite]]));

    expect(sheet.frames['body']).toEqual({
      frame: { x: 4, y: 6, w: 70, h: 60 },
      rotated: false,
      trimmed: true,
      spriteSourceSize: { x: 10, y: 5, w: 70, h: 60 },
      sourceSize: { w: 100, h: 80 },
      anchor: { x: 0.5, y: 0.5 },
    });
    expect(sheet.meta).toEqual({ image: 'a.png', size: { w: 128, h: 128 }, scale: 1 });
  });

  it('includesBordersOnlyForSlicedSprites', () => {
    const sliced = { ...sprite, borders: { left: 3, top: 0, right: 4, bottom: 0 } };
    const sheet = buildSpritesheet({ width: 128, height: 128, placements: [{ id: 'body', x: 0, y: 0 }] }, 'a.png', new Map([['body', sliced]]));

    expect(sheet.frames['body']?.borders).toEqual({ left: 3, top: 0, right: 4, bottom: 0 });
  });

  it('failsWhenAPlacedSpriteIsMissing', () => {
    expect(() => buildSpritesheet({ width: 1, height: 1, placements: [{ id: 'ghost', x: 0, y: 0 }] }, 'a.png', new Map())).toThrow(/ghost/);
  });
});

describe('renderManifestModule', () => {
  it('importsEveryFileAndListsPixelsPerUnit', () => {
    const source = renderManifestModule({
      atlases: [{ name: 'ui', pages: [{ image: 'atlases/ui-0.png', data: 'atlases/ui-0.json' }] }],
      textures: [{ id: 'background', image: 'textures/background.jpg', anchor: { x: 0.5, y: 0.5 } }],
      fonts: [{ family: 'Comic Roasting', file: 'fonts/comic-roasting.otf' }],
      pixelsPerUnit: { sling: 100, background: 100 },
      aliases: { 'gizmo8-0': 'gizmo8-1' },
    });

    expect(source).toContain('import asset0 from "./atlases/ui-0.png";');
    expect(source).toContain('{ name: "ui", pages: [{ image: asset0, data: asset1 }] },');
    expect(source).toContain('{ id: "background", image: asset2, anchor: { x: 0.5, y: 0.5 } },');
    expect(source).toContain('{ family: "Comic Roasting", url: asset3 },');
    expect(source.indexOf('"background": 100')).toBeLessThan(source.indexOf('"sling": 100'));
    expect(source).toContain('"gizmo8-0": "gizmo8-1",');
  });

  it('quotesNamesSafely', () => {
    const source = renderManifestModule({ atlases: [], textures: [], fonts: [{ family: "Bob's Font", file: "fonts/bob's.otf" }], pixelsPerUnit: {}, aliases: {} });

    expect(source).toContain('import asset0 from "./fonts/bob\'s.otf";');
    expect(source).toContain('{ family: "Bob\'s Font", url: asset0 },');
  });
});

describe('validateCatalog', () => {
  const sprite: SourceSprite = {
    id: 'gizmo8-1',
    file: 'enemy/gizmo8-1.png',
    width: 10,
    height: 10,
    pixelsPerUnit: 100,
    anchor: { x: 0.5, y: 0.5 },
    borders: { left: 0, top: 0, right: 0, bottom: 0 },
  };

  it('acceptsAValidCatalogWithAliases', () => {
    expect(() => validateCatalog({ sprites: [sprite], fonts: [], aliases: { 'gizmo8-0': 'gizmo8-1' } })).not.toThrow();
  });

  it('rejectsDuplicateIds', () => {
    expect(() => validateCatalog({ sprites: [sprite, sprite], fonts: [], aliases: {} })).toThrow(/Duplicate asset id 'gizmo8-1'/);
  });

  it('rejectsMalformedCatalogAndEntries', () => {
    expect(() => validateCatalog({ sprites: [], fonts: [] })).toThrow(/"sprites", "fonts" and "aliases"/);
    expect(() => validateCatalog({ sprites: [{ ...sprite, width: 'wide' }], fonts: [], aliases: {} })).toThrow(/Malformed sprite entry/);
  });

  it('rejectsAliasesToUnknownOrShadowedIds', () => {
    expect(() => validateCatalog({ sprites: [sprite], fonts: [], aliases: { ghost: 'missing' } })).toThrow(/Alias 'ghost'/);
    expect(() => validateCatalog({ sprites: [sprite], fonts: [], aliases: { 'gizmo8-1': 'gizmo8-1' } })).toThrow(/Alias 'gizmo8-1'/);
  });
});
