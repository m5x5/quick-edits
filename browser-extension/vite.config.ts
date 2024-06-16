import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import webExtension from 'vite-plugin-web-extension';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    hmr: false,
  },
  plugins: [
    tailwindcss(),
    webExtension({
      disableAutoLaunch: true,
      transformManifest: (manifest) => {
        manifest.version = manifest.version.replace(/\.\d+$/, `.${new Date().getMilliseconds()}`);
        return manifest;
      }
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
