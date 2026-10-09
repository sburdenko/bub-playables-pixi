/**
 * The ad network SDK as the playable sees it. Each network build ships exactly one implementation, chosen at build
 * time from the Vite mode (`vite build --mode mraid`).
 */
export interface IAdNetwork {
  /** Called once the game is loaded and drawn; resolves when play may start (SDK ready and the ad on screen). */
  start(): Promise<void>;
  /** Sends the player to the store. Only call from a user gesture. */
  openStore(): void;
  /** Tells the network the experience is over (end card shown). */
  notifyEnded(): void;
  /** Called with `true` when the ad is hidden and the game should pause, `false` when it is visible again. */
  onPauseChange(listener: (isPaused: boolean) => void): void;
}
