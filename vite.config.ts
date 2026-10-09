import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Tags each ad network requires in the page head; the build mode names the network (`--mode mraid`). */
const NETWORK_HEAD: Readonly<Record<string, readonly HtmlTagDescriptor[]>> = {
  mraid: [{ tag: 'script', attrs: { src: 'mraid.js' }, injectTo: 'head-prepend' }],
  google: [
    { tag: 'meta', attrs: { name: 'ad.size', content: 'width=320,height=480' }, injectTo: 'head-prepend' },
    { tag: 'script', attrs: { src: 'https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js' }, injectTo: 'head-prepend' },
  ],
};

function adNetworkHead(mode: string): Plugin {
  return { name: 'ad-network-head', transformIndexHtml: () => [...(NETWORK_HEAD[mode] ?? [])] };
}

export default defineConfig(({ command, mode }) => ({
  base: './',
  plugins: command === 'build' ? [adNetworkHead(mode), viteSingleFile({ removeViteModuleLoader: true })] : [],
  build: {
    target: 'es2020',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: {
    host: true,
  },
}));
