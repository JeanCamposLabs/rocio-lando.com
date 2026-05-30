// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// STAGING=1 builds for the GitHub Pages project sub-path
// (jeancamposlabs.github.io/rocio-lando.com/). Default build targets the
// production root domain (rocio-lando.com).
const STAGING = process.env.STAGING === '1';

// https://astro.build/config
export default defineConfig({
  site: STAGING ? 'https://jeancamposlabs.github.io' : 'https://rocio-lando.com',
  base: STAGING ? '/rocio-lando.com' : '/',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  image: {
    // We pre-optimize artwork via scripts/optimize-images.mjs (sharp),
    // so the build stays fast even with hundreds of works.
    responsiveStyles: true,
  },
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
