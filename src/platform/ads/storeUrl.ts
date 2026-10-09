/** Store link for networks that open a URL themselves (MRAID). Set per build in `.env` files; empty in dev. */
export function storeUrl(): string {
  const isIos = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  const url = isIos ? import.meta.env.VITE_STORE_URL_IOS : import.meta.env.VITE_STORE_URL_ANDROID;

  return url ?? '';
}
