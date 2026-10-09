import type { IAdNetwork } from './IAdNetwork';

/** Networks whose SDK is a few global functions. Missing functions are skipped so the build still runs locally. */
type Callbacks = { readonly ready?: string; readonly install: string; readonly end?: string };

const GOOGLE: Callbacks = { install: 'ExitApi.exit' };
const META: Callbacks = { install: 'FbPlayableAd.onCTAClick' };
const MINTEGRAL: Callbacks = { ready: 'gameReady', install: 'install', end: 'gameEnd' };

export class CallbackAdNetwork implements IAdNetwork {
  static readonly google = (): CallbackAdNetwork => new CallbackAdNetwork(GOOGLE);
  static readonly meta = (): CallbackAdNetwork => new CallbackAdNetwork(META);
  static readonly mintegral = (): CallbackAdNetwork => new CallbackAdNetwork(MINTEGRAL);

  private readonly _callbacks: Callbacks;

  private constructor(callbacks: Callbacks) {
    this._callbacks = callbacks;
  }

  start(): Promise<void> {
    call(this._callbacks.ready);

    return Promise.resolve();
  }

  openStore(): void {
    call(this._callbacks.install);
  }

  notifyEnded(): void {
    call(this._callbacks.end);
  }

  onPauseChange(): void {
    // These SDKs do not report visibility; the browser pauses animation frames when the ad is hidden.
  }
}

/** Calls a global such as `ExitApi.exit` if the network injected it. */
function call(path: string | undefined): void {
  if (path === undefined) {
    return;
  }

  const [owner, method] = path.includes('.') ? path.split('.') : [undefined, path];
  const target = (owner === undefined ? window : (window as unknown as Record<string, unknown>)[owner]) as Record<string, unknown> | undefined;
  const fn = method === undefined ? undefined : target?.[method];
  if (typeof fn === 'function') {
    (fn as () => void).call(target);
  } else {
    console.warn(`Ad network function '${path}' is not available.`);
  }
}
