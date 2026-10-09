import { Application } from 'pixi.js';
import type { IRandom } from '../core/random/IRandom';
import { MathRandom } from '../core/random/MathRandom';
import { SeededRandom } from '../core/random/SeededRandom';
import { computeViewportLayout, screenToWorld } from '../domain/layout/ViewportLayout';
import { ASSET_MANIFEST } from '../generated/assets';
import { selectAdNetwork } from '../platform/ads/selectAdNetwork';
import { loadAssets } from '../platform/assets/AssetLoader';
import { PointerInput } from '../platform/input/PointerInput';
import { Playable } from './Playable';

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

  const ads = selectAdNetwork(import.meta.env.MODE);
  const [textures] = await Promise.all([loadAssets(ASSET_MANIFEST), ads.start()]);
  let layout = computeViewportLayout(app.screen.width, app.screen.height);
  const pointer = new PointerInput(app.canvas, (x, y) => screenToWorld(layout, x, y));
  const playable = new Playable(textures, randomFromUrl(), pointer, layout, ads);
  app.stage.addChild(playable.scene);
  app.renderer.on('resize', () => {
    layout = computeViewportLayout(app.screen.width, app.screen.height);
    playable.applyLayout(layout);
  });
  app.ticker.add((ticker) => playable.update(Math.min(ticker.deltaMS / 1000, MAX_DELTA_SECONDS)));
  ads.onPauseChange((isPaused) => (isPaused ? app.ticker.stop() : app.ticker.start()));

  return app;
}

/** `?seed=N` makes every random choice repeatable (tests, bug reports); otherwise play is random. */
function randomFromUrl(): IRandom {
  const seed = Number.parseInt(new URLSearchParams(window.location.search).get('seed') ?? '', 10);

  return Number.isFinite(seed) ? new SeededRandom(seed) : new MathRandom();
}

/** Lets the PixiJS DevTools browser extension inspect the scene; dev builds only. */
function exposeToDevtools(app: Application): void {
  if (import.meta.env.DEV) {
    (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;
  }
}
