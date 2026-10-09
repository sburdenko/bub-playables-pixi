import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';
import { ASSET_MANIFEST } from '../generated/assets';
import { loadAssets, type TextureLibrary } from '../platform/assets/AssetLoader';

const CELL_SIZE = 180;
const IMAGE_SIZE = 140;
const PADDING = 12;
const LABEL_STYLE = { fontFamily: 'monospace', fontSize: 11, fill: 0xdddddd } as const;

/** Dev page: every texture from the manifest with its id, pixel size and pixels-per-unit. */
async function main(): Promise<void> {
  const host = document.getElementById('gallery');
  if (host === null) {
    throw new Error('dev/assets.html must contain <div id="gallery">.');
  }

  const textures = await loadAssets(ASSET_MANIFEST);
  const columns = Math.max(1, Math.floor(host.clientWidth / CELL_SIZE));
  const rows = Math.ceil(textures.ids.length / columns);
  const app = new Application();
  await app.init({ width: columns * CELL_SIZE, height: rows * CELL_SIZE + PADDING, background: 0x2a2f3a, antialias: true });
  host.appendChild(app.canvas);
  (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;

  textures.ids.forEach((id, index) => {
    const cell = createCell(textures, id);
    cell.position.set((index % columns) * CELL_SIZE, Math.floor(index / columns) * CELL_SIZE);
    app.stage.addChild(cell);
  });
  host.setAttribute('data-state', 'ready');
}

function createCell(textures: TextureLibrary, id: string): Container {
  const texture = textures.get(id);
  const cell = new Container();
  const frame = new Graphics().rect(PADDING / 2, PADDING / 2, CELL_SIZE - PADDING, CELL_SIZE - PADDING).fill(0x1d2129);
  const sprite = new Sprite({ texture, anchor: 0.5 });
  sprite.scale.set(Math.min(1, IMAGE_SIZE / Math.max(texture.width, texture.height)));
  sprite.position.set(CELL_SIZE / 2, PADDING + IMAGE_SIZE / 2);
  const label = new Text({
    text: `${id}\n${texture.width}×${texture.height} · ${textures.pixelsPerUnit(id).toFixed(1)} ppu`,
    style: LABEL_STYLE,
  });
  label.position.set(PADDING, CELL_SIZE - PADDING - label.height);
  cell.addChild(frame, sprite, label);

  return cell;
}

main().catch((error: unknown) => {
  document.getElementById('gallery')?.setAttribute('data-state', 'failed');
  console.error('Asset gallery failed', error);
});
