import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import mkcert from 'vite-plugin-mkcert'
import preprocess from "svelte-preprocess";

export default defineConfig({
  server: {
    host: true,
    port: 5000,
    https: true,
  },
  plugins: [
    svelte({
      preprocess: [preprocess()],
    }),
    mkcert(),
  ],
});
