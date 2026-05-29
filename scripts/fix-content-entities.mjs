#!/usr/bin/env node
// Decode WordPress HTML entities in migrated Astro markdown content.
//
// Usage:
//   node scripts/fix-content-entities.mjs             # apply changes
//   node scripts/fix-content-entities.mjs --dry-run   # report only, no writes
//   node scripts/fix-content-entities.mjs --verbose   # print per-line diffs
//
// Scope: src/content/news/**/*.md and src/content/pages/**/*.md
// Decodes: frontmatter title/excerpt/description fields + markdown body
// Does NOT touch: body within fenced code blocks (none exist in this corpus)

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..');
const CONTENT_DIR = join(REPO_ROOT, 'src/content');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// ── Entity decoding ────────────────────────────────────────────────────────

// All 22 distinct entities confirmed present in this corpus, plus defensive extras.
const NAMED_ENTITIES = {
  amp: '&',
  apos: "'",
  bull: '•',
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
};

// Sort longest-first so no shorter name can shadow a longer prefix.
const NAMED_ENTITY_RE = new RegExp(
  '&(' + Object.keys(NAMED_ENTITIES).sort((a, b) => b.length - a.length).join('|') + ');',
  'g',
);

function decodeEntities(str) {
  // 1. named entities
  str = str.replace(NAMED_ENTITY_RE, (_, name) => NAMED_ENTITIES[name]);
  // 2. hex numeric  &#xNNNN;
  str = str.replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  // 3. decimal numeric  &#NNN;  (run after named so &amp;#NNN; → &#NNN; → char)
  str = str.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  return str;
}

// ── YAML re-quoting ────────────────────────────────────────────────────────
// prefix = 'title: '  (everything up to and including the opening space)
// value  = the decoded string that will become the scalar value

function requoteYaml(prefix, value) {
  const hasDouble = value.includes('"');
  const hasSingle = value.includes("'");

  if (!hasDouble) {
    // Double-quoted is safe (no " inside)
    return `${prefix}"${value}"`;
  }
  if (!hasSingle) {
    // Single-quoted: " inside is fine, no escaping needed in single-quoted YAML
    return `${prefix}'${value}'`;
  }
  // Both " and ': double-quoted with backslash escaping
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `${prefix}"${escaped}"`;
}

// ── File walking ───────────────────────────────────────────────────────────

async function* walkMd(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkMd(full);
    else if (entry.name.endsWith('.md')) yield full;
  }
}

// ── Stats ──────────────────────────────────────────────────────────────────

const stats = {
  total: 0,
  changed: 0,
  unchanged: 0,
  skipped: 0,
  title: 0,
  excerpt: 0,
  description: 0,
  body: 0,
};

// ── Per-file processing ────────────────────────────────────────────────────

// Matches double-quoted title/excerpt/description frontmatter lines.
const FM_RE = /^((?:title|excerpt|description):\s*)"((?:[^"\\]|\\.)*)"\s*$/;

async function processFile(filePath) {
  stats.total++;
  const rel = filePath.replace(REPO_ROOT + '/', '');
  const original = await readFile(filePath, 'utf8');
  const lines = original.split('\n');

  if (lines[0] !== '---') {
    process.stderr.write(`WARN: ${rel}: no opening --- — skipped\n`);
    stats.skipped++;
    return;
  }
  const closeIdx = lines.indexOf('---', 1);
  if (closeIdx === -1) {
    process.stderr.write(`WARN: ${rel}: no closing --- — skipped\n`);
    stats.skipped++;
    return;
  }

  const fmLines = lines.slice(1, closeIdx);
  const bodyLines = lines.slice(closeIdx + 1);

  // ── Frontmatter pass ────────────────────────────────────────────────────

  let fmChanged = false;
  const fieldChanged = { title: false, excerpt: false, description: false };

  const newFmLines = fmLines.map((line) => {
    const m = line.match(FM_RE);
    if (!m) return line;

    const [, prefix, rawValue] = m;
    const field = prefix.split(':')[0]; // 'title' | 'excerpt' | 'description'

    // Unexpected YAML backslash escape — skip this line to avoid corruption.
    // In this corpus (verified) no such escapes exist, but be defensive.
    if (/\\[^\\]/.test(rawValue)) {
      process.stderr.write(`WARN: ${rel}: unexpected YAML escape in ${field} — line unchanged\n`);
      return line;
    }

    let decoded = decodeEntities(rawValue);
    // Strip leading whitespace including U+00A0 that came from &nbsp;
    decoded = decoded.replace(/^[ \t ]+/, '');

    // Control characters would corrupt YAML — abort rather than silently mangle.
    if (/[\x00-\x09\x0b-\x1f\x7f]/.test(decoded)) {
      process.stderr.write(`ERROR: ${rel}: control character in ${field} after decoding — aborting\n`);
      process.exit(1);
    }

    const newLine = requoteYaml(prefix, decoded);
    if (newLine === line) return line;

    if (VERBOSE) {
      console.log(`  [${field}]`);
      console.log(`    - ${line}`);
      console.log(`    + ${newLine}`);
    }

    fmChanged = true;
    fieldChanged[field] = true;
    return newLine;
  });

  // ── Body pass ───────────────────────────────────────────────────────────

  const bodyStr = bodyLines.join('\n');
  const newBodyStr = decodeEntities(bodyStr);
  const bodyChanged = newBodyStr !== bodyStr;

  // ── Write ───────────────────────────────────────────────────────────────

  const fileChanged = fmChanged || bodyChanged;
  if (!fileChanged) {
    stats.unchanged++;
    return;
  }

  stats.changed++;
  if (fieldChanged.title) stats.title++;
  if (fieldChanged.excerpt) stats.excerpt++;
  if (fieldChanged.description) stats.description++;
  if (bodyChanged) stats.body++;

  if (VERBOSE && !fmChanged) console.log(`  ${rel}: body only`);

  if (!DRY_RUN) {
    const bodyToUse = bodyChanged ? newBodyStr : bodyStr;
    const newContent = ['---', ...newFmLines, '---', ...bodyToUse.split('\n')].join('\n');
    await writeFile(filePath, newContent, 'utf8');
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no files will be written\n');

  for await (const file of walkMd(CONTENT_DIR)) {
    if (VERBOSE) console.log(`\n${file.replace(REPO_ROOT + '/', '')}`);
    await processFile(file);
  }

  console.log(`\nScanned:   ${stats.total} files`);
  console.log(`Changed:   ${stats.changed}`);
  console.log(`  Frontmatter title:       ${stats.title} files`);
  console.log(`  Frontmatter excerpt:     ${stats.excerpt} files`);
  console.log(`  Frontmatter description: ${stats.description} files`);
  console.log(`  Body:                    ${stats.body} files`);
  console.log(`Unchanged: ${stats.unchanged}`);
  if (stats.skipped > 0) console.log(`Skipped:   ${stats.skipped} (no frontmatter)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
