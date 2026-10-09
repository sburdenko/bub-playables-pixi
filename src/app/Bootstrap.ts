import { Application } from 'pixi.js';
import { ASSET_MANIFEST } from '../generated/assets';
import { loadAssets } from '../platform/assets/AssetLoader';
import { ScaffoldScene } from './ScaffoldScene';

const MAX_RESOLUTION = 2;
const CLEAR_COLOR = 0x000000;

/** Composition root: the only place that creates and wires the playable's objects. */
export async function startPlayable(host: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    background: CLEAR_COLOR,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio, MAX_RESOLUTION),
  });
  host.appendChild(app.canvas);
  exposeToDevtools(app);

  const textures = await loadAssets(ASSET_MANIFEST);
  const scene = new ScaffoldScene(textures);
  app.stage.addChild(scene);
  const layout = () => scene.layout(app.screen.width, app.screen.height);
  app.renderer.on('resize', layout);
  layout();

  return app;
}

/** Lets the PixiJS DevTools browser extension inspect the scene; dev builds only. */
function exposeToDevtools(app: Application): void {
  if (import.meta.env.DEV) {
    (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;
  }
}
