import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://aazainkhan.com",
  devToolbar: {
    enabled: false,
  },
  integrations: [react(), sitemap()],
  prefetch: true,
  vite: {
    ssr: {
      noExternal: ["smartypants"],
    },
  },
  output: "server",
  adapter: cloudflare(),
});
