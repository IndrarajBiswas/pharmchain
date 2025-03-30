/// <reference types="vite/client" />

// Define the environment variables explicitly
interface ImportMetaEnv {
  readonly VITE_PINATA_JWT: string;
  readonly VITE_GATEWAY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
