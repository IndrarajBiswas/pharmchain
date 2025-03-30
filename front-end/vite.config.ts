// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Load .env manually for debugging
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  console.log('✅ VITE_PINATA_JWT:', env.VITE_PINATA_JWT);
  console.log('✅ VITE_GATEWAY_URL:', env.VITE_GATEWAY_URL);

  return {
    plugins: [react()],
    envPrefix: 'VITE_', // ✅ This ensures only VITE_ prefixed variables are loaded
  };
});
