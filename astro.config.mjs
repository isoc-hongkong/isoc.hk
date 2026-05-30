// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeUploadsPicture from './scripts/rehype-uploads-picture.mjs';

export default defineConfig({
  site: 'https://www.isoc.hk',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  markdown: {
    rehypePlugins: [rehypeUploadsPicture],
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/wp-admin') && !page.includes('/wp-login'),
    }),
    mdx(),
  ],
});
