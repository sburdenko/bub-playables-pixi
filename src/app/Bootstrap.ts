import { Application } from 'pixi.js';
import { MathRandom } from '../core/random/MathRandom';
import { computeViewportLayout } from '../domain/layout/ViewportLayout';
import { ASSET_MANIFEST } from '../generated/assets';
import { loadAssets } from '../platform/assets/AssetLoader';
import { SceneView } from '../view/scene/SceneView';

const MAX_RESOLUTION = 2;
const CLEAR_COLOR = 0x000000;
/** Longest frame step; after a tab switch the game resumes instead of jumping ahead. */
const MAX_DELTA_SECONDS = 0.1;

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
  const scene = new SceneView(textures, new MathRandom());
  app.stage.addChild(scene);

  const layout = () => scene.applyLayout(computeViewportLayout(app.screen.width, app.screen.height));
  app.renderer.on('resize', layout);
  layout();
  app.ticker.add((ticker) => scene.update(Math.min(ticker.deltaMS / 1000, MAX_DELTA_SECONDS)));

  return app;
}

/** Lets the PixiJS DevTools browser extension inspect the scene; dev builds only. */
function exposeToDevtools(app: Application): void {
  if (import.meta.env.DEV) {
    (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;
  }
}
