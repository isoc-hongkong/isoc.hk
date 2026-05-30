#!/usr/bin/env node
// Generate WebP siblings for every raster image in public/images/uploads/.
// Idempotent: skips when a .webp sibling exists and is newer than the source.
//
// Usage:
//   node scripts/convert-uploads-to-webp.mjs             # process all
//   node scripts/convert-uploads-to-webp.mjs --dry-run   # report only
//   node scripts/convert-uploads-to-webp.mjs --limit 10  # process first N (sanity check)

import { readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..');
const UPLOADS_DIR = join(REPO_ROOT, 'public/images/uploads');

const DRY_RUN = process.argv.includes('--dry-run');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : Infinity;

const RASTER_EXTS = new Set(['.jpg', '.jpeg', '.png']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile()) yield p;
  }
}

async function isOutdated(src, dst) {
  try {
    const [s, d] = await Promise.all([stat(src), stat(dst)]);
    return s.mtimeMs > d.mtimeMs;
  } catch {
    return true; // dst missing
  }
}

async function convert(src) {
  const ext = extname(src).toLowerCase();
  const dst = src.slice(0, -ext.length) + '.webp';
  if (!(await isOutdated(src, dst))) return { src, dst, skipped: true };
  if (DRY_RUN) return { src, dst, dryRun: true };

  const meta = await sharp(src).metadata();
  const opts = meta.hasAlpha
    ? { quality: 85, alphaQuality: 100, effort: 6 }
    : { quality: 80, effort: 6 };
  await sharp(src).webp(opts).toFile(dst);
  const [srcStat, dstStat] = await Promise.all([stat(src), stat(dst)]);
  return { src, dst, srcBytes: srcStat.size, dstBytes: dstStat.size };
}

const queue = [];
for await (const p of walk(UPLOADS_DIR)) {
  if (RASTER_EXTS.has(extname(p).toLowerCase())) queue.push(p);
}
queue.sort();

let processed = 0;
let skipped = 0;
let srcTotal = 0;
let dstTotal = 0;
const errors = [];

console.log(`Found ${queue.length} raster files. ${DRY_RUN ? 'Dry run.' : ''}`);

for (const src of queue.slice(0, LIMIT)) {
  try {
    const r = await convert(src);
    const rel = r.src.slice(REPO_ROOT.length + 1);
    if (r.skipped) {
      skipped++;
      continue;
    }
    if (r.dryRun) {
      console.log(`would convert: ${rel}`);
      processed++;
      continue;
    }
    processed++;
    srcTotal += r.srcBytes;
    dstTotal += r.dstBytes;
    const pct = ((1 - r.dstBytes / r.srcBytes) * 100).toFixed(0);
    if (processed % 50 === 0 || processed <= 10) {
      console.log(`[${processed}/${queue.length}] ${basename(rel)} ${r.srcBytes}→${r.dstBytes} (-${pct}%)`);
    }
  } catch (e) {
    errors.push({ src, err: e.message });
    console.error(`ERR ${src}: ${e.message}`);
  }
}

console.log('');
console.log(`Done. processed=${processed} skipped=${skipped} errors=${errors.length}`);
if (srcTotal > 0) {
  const savedMB = ((srcTotal - dstTotal) / 1024 / 1024).toFixed(2);
  const pct = ((1 - dstTotal / srcTotal) * 100).toFixed(1);
  console.log(`Bytes: ${(srcTotal / 1024 / 1024).toFixed(2)} MB → ${(dstTotal / 1024 / 1024).toFixed(2)} MB (saved ${savedMB} MB, -${pct}%)`);
}
if (errors.length) process.exitCode = 1;
