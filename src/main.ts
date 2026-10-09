import { startPlayable } from './app/Bootstrap';

const HOST_ID = 'app';

const host = document.getElementById(HOST_ID);
if (host === null) {
  throw new Error(`index.html must contain <div id="${HOST_ID}">.`);
}

startPlayable(host)
  .then(() => host.setAttribute('data-state', 'ready'))
  .catch((error: unknown) => {
    host.setAttribute('data-state', 'failed');
    console.error('Playable failed to start', error);
  });
