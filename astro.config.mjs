// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';

export default defineConfig({
  site: 'https://www.isoc.hk',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/wp-admin') && !page.includes('/wp-login'),
    }),
    sanity({
      projectId: '53w3a4w0',
      dataset: 'production',
      useCdn: false,
    }),
  ],
});

