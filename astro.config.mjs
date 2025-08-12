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
  prefetch: {
    prefetchAll: false, // Only prefetch visible links
    defaultStrategy: "hover",
  },
  vite: {
    ssr: {
      noExternal: ["smartypants"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'fancybox-vendor': ['@fancyapps/ui'],
            'motion-vendor': ['framer-motion', '@react-spring/web'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['@fancyapps/ui', 'framer-motion'],
    },
  },
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: {
      enabled: true,
    },
    runtime: {
      mode: "remote",
      type: "pages",
    },
    routes: {
      strategy: "include",
      patterns: ["/*"],
    },
  }),
  build: {
    inlineStylesheets: "auto",
  },
});
