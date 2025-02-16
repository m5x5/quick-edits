import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import packageJSON from "./package.json";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@tanstack/react-query"]
  },
  server: {
    hmr: false,
  },
  build: {
    sourcemap: "inline",
    commonjsOptions: {
      include: [/node_modules/], // Ensures CommonJS modules are bundled correctly
    },
  },
  plugins: [
    tailwindcss(),
    webExtension({
      disableAutoLaunch: true,
      transformManifest: (manifest) => {
        // this logic is for reload functionality during development
        if (process.env.WATCH === "true") {
          manifest.version = manifest.version.replace(
            /\.\d+$/,
            `.${new Date().getMilliseconds()}`,
          );
        } else {
          manifest.version = packageJSON.version;
        }
        manifest.$schema = undefined;

        return manifest;
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
