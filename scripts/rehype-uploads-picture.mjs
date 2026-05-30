// Rehype plugin: wrap <img src="/images/uploads/...{jpg,jpeg,png}"> in a
// <picture> with a <source srcset=".webp" type="image/webp"> when the .webp
// sibling exists on disk. Adds loading="lazy" + decoding="async" to the img.
//
// Only rewrites /images/uploads/ paths; external URLs and non-raster refs are
// left untouched.

import { existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..');
const PUBLIC_DIR = resolve(REPO_ROOT, 'public');
const RASTER_EXTS = new Set(['.jpg', '.jpeg', '.png']);

const webpExists = new Map();
function hasWebpSibling(srcPath) {
  if (webpExists.has(srcPath)) return webpExists.get(srcPath);
  const webpFs = resolve(PUBLIC_DIR, '.' + srcPath.replace(/\.(jpe?g|png)$/i, '.webp'));
  const ok = existsSync(webpFs);
  webpExists.set(srcPath, ok);
  return ok;
}

export default function rehypeUploadsPicture() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img' || !parent || typeof index !== 'number') return;
      const src = node.properties?.src;
      if (typeof src !== 'string') return;
      if (!src.startsWith('/images/uploads/')) return;
      const ext = extname(src).toLowerCase();
      if (!RASTER_EXTS.has(ext)) return;
      if (!hasWebpSibling(src)) return;

      const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');

      node.properties.loading ??= 'lazy';
      node.properties.decoding ??= 'async';

      const picture = {
        type: 'element',
        tagName: 'picture',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'source',
            properties: { srcSet: webpSrc, type: 'image/webp' },
            children: [],
          },
          node,
        ],
      };
      parent.children[index] = picture;
    });
  };
}
