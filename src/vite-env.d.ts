/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_URL_IOS?: string;
  readonly VITE_STORE_URL_ANDROID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
