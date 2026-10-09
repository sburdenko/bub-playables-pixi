import type { IAdNetwork } from './IAdNetwork';
import { storeUrl } from './storeUrl';

type Mraid = {
  getState(): string;
  isViewable(): boolean;
  addEventListener(event: string, listener: (value?: boolean) => void): void;
  open(url: string): void;
};

/** MRAID 2/3 containers: AppLovin, ironSource, Unity Ads, Vungle. Waits for `ready` and visibility before starting. */
export class MraidAdNetwork implements IAdNetwork {
  private readonly _mraid: Mraid | undefined = (window as { mraid?: Mraid }).mraid;

  start(): Promise<void> {
    const mraid = this._mraid;
    if (mraid === undefined) {
      console.warn('mraid.js is not available; starting without the ad container.');

      return Promise.resolve();
    }

    return this.whenReady(mraid).then(() => this.whenViewable(mraid));
  }

  openStore(): void {
    const url = storeUrl();
    if (this._mraid === undefined) {
      window.open(url, '_blank');
    } else {
      this._mraid.open(url);
    }
  }

  notifyEnded(): void {
    // MRAID has no end-of-experience call; the container only needs mraid.open from the end card.
  }

  onPauseChange(listener: (isPaused: boolean) => void): void {
    this._mraid?.addEventListener('viewableChange', (isViewable) => listener(isViewable !== true));
  }

  private whenReady(mraid: Mraid): Promise<void> {
    return mraid.getState() === 'loading' ? new Promise((resolve) => mraid.addEventListener('ready', () => resolve())) : Promise.resolve();
  }

  private whenViewable(mraid: Mraid): Promise<void> {
    return mraid.isViewable()
      ? Promise.resolve()
      : new Promise((resolve) => mraid.addEventListener('viewableChange', (isViewable) => isViewable === true && resolve()));
  }
}
