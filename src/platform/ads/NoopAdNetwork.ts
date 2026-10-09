import type { IAdNetwork } from './IAdNetwork';
import { storeUrl } from './storeUrl';

/** Development and plain web builds: no SDK, the store link opens in a new tab. */
export class NoopAdNetwork implements IAdNetwork {
  start(): Promise<void> {
    return Promise.resolve();
  }

  openStore(): void {
    const url = storeUrl();
    if (url === '') {
      console.warn('No store URL configured (VITE_STORE_URL_IOS / VITE_STORE_URL_ANDROID).');

      return;
    }

    window.open(url, '_blank');
  }

  notifyEnded(): void {
    // Without an SDK nobody listens for the end.
  }

  onPauseChange(): void {
    // Without an SDK the page is never hidden by an ad container; the browser pauses frames itself.
  }
}
