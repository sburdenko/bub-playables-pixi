import { Assets, Spritesheet, Texture, type SpritesheetData } from 'pixi.js';

export type AssetManifest = {
  readonly atlases: readonly { readonly name: string; readonly pages: readonly { readonly image: string; readonly data: unknown }[] }[];
  readonly textures: readonly { readonly id: string; readonly image: string; readonly anchor: { readonly x: number; readonly y: number } }[];
  readonly fonts: readonly { readonly family: string; readonly url: string }[];
  readonly pixelsPerUnit: Readonly<Record<string, number>>;
  /** Ids that resolve to another texture id (deliberate substitutions made by the asset pipeline). */
  readonly aliases: Readonly<Record<string, string>>;
};

/** Every loaded texture by asset id, with the pixels-per-world-unit that gives it its size in the world. */
export class TextureLibrary {
  private readonly _textures: ReadonlyMap<string, Texture>;
  private readonly _pixelsPerUnit: Readonly<Record<string, number>>;
  private readonly _aliases: Readonly<Record<string, string>>;

  constructor(textures: ReadonlyMap<string, Texture>, pixelsPerUnit: Readonly<Record<string, number>>, aliases: Readonly<Record<string, string>>) {
    this._textures = textures;
    this._pixelsPerUnit = pixelsPerUnit;
    this._aliases = aliases;
  }

  get ids(): readonly string[] {
    return [...this._textures.keys()].sort();
  }

  get(id: string): Texture {
    const texture = this._textures.get(this.resolve(id));
    if (texture === undefined) {
      throw new Error(`Texture '${id}' is not in the asset manifest. Known ids: ${this.ids.join(', ')}`);
    }

    return texture;
  }

  pixelsPerUnit(id: string): number {
    const value = this._pixelsPerUnit[this.resolve(id)];
    if (value === undefined) {
      throw new Error(`Texture '${id}' has no pixels-per-unit in the asset manifest.`);
    }

    return value;
  }

  private resolve(id: string): string {
    return this._aliases[id] ?? id;
  }
}

/** Loads fonts, atlases and standalone textures in parallel. */
export async function loadAssets(manifest: AssetManifest): Promise<TextureLibrary> {
  const [, atlasTextures, singleTextures] = await Promise.all([
    Promise.all(manifest.fonts.map(loadFont)),
    Promise.all(manifest.atlases.flatMap((atlas) => atlas.pages.map((page) => loadAtlasPage(atlas.name, page)))),
    Promise.all(manifest.textures.map(loadSingleTexture)),
  ]);
  const textures = new Map<string, Texture>([...atlasTextures.flat(), ...singleTextures]);

  return new TextureLibrary(textures, manifest.pixelsPerUnit, manifest.aliases);
}

async function loadFont(font: AssetManifest['fonts'][number]): Promise<void> {
  const face = new FontFace(font.family, `url(${font.url})`);
  document.fonts.add(await describeFailure(`font '${font.family}'`, face.load()));
}

async function loadAtlasPage(atlas: string, page: AssetManifest['atlases'][number]['pages'][number]): Promise<[string, Texture][]> {
  if (!isSpritesheetData(page.data)) {
    throw new Error(`Atlas '${atlas}' page data is not a spritesheet (missing "frames" or "meta"). Run "npm run assets:build".`);
  }

  const texture = await describeFailure(`atlas '${atlas}'`, Assets.load<Texture>(page.image));
  const frames = await new Spritesheet(texture, page.data).parse();

  return Object.entries(frames);
}

async function loadSingleTexture(entry: AssetManifest['textures'][number]): Promise<[string, Texture]> {
  const loaded = await describeFailure(`texture '${entry.id}'`, Assets.load<Texture>(entry.image));

  return [entry.id, new Texture({ source: loaded.source, defaultAnchor: { x: entry.anchor.x, y: entry.anchor.y } })];
}

function isSpritesheetData(data: unknown): data is SpritesheetData {
  const candidate = data as Partial<SpritesheetData> | null;

  return typeof candidate?.frames === 'object' && candidate.frames !== null && typeof candidate.meta === 'object';
}

async function describeFailure<T>(what: string, loading: Promise<T>): Promise<T> {
  try {
    return await loading;
  } catch (error) {
    throw new Error(`Failed to load ${what}`, { cause: error });
  }
}
