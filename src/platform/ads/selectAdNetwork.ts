import { CallbackAdNetwork } from './CallbackAdNetwork';
import type { IAdNetwork } from './IAdNetwork';
import { MraidAdNetwork } from './MraidAdNetwork';
import { NoopAdNetwork } from './NoopAdNetwork';

/** The build mode names the network: `vite build --mode mraid`. Anything else (dev, plain build) gets no SDK. */
export function selectAdNetwork(mode: string): IAdNetwork {
  switch (mode) {
    case 'mraid':
      return new MraidAdNetwork();
    case 'google':
      return CallbackAdNetwork.google();
    case 'meta':
      return CallbackAdNetwork.meta();
    case 'mintegral':
      return CallbackAdNetwork.mintegral();
    default:
      return new NoopAdNetwork();
  }
}
