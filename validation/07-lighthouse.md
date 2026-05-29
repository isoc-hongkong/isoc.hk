# Test 07 — Lighthouse Performance Baseline

**Effort:** ~10 min | **Prereqs:** Preview server running + Chrome DevTools MCP | **Tools:** chrome-devtools MCP (`lighthouse_audit`)

## Goal

Run Lighthouse on key Astro pages and compare scores against the live WordPress site. The Astro static build should significantly outperform WordPress on Performance and Best Practices — if it doesn't, there's something wrong (e.g., unoptimized external images, large JS bundles, render-blocking resources). Capture this as a baseline to measure future improvements.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Local preview: `http://localhost:4321` (use `npm run preview` — static file serving, closer to production)
- Live WP site: `https://www.isoc.hk`
- Astro stack: static SSG, single CSS bundle, no client-side framework, Pagefind for search

## Prerequisites

```bash
cd /Users/chpapa/Workspaces/isoc.hk/astro-site
npm run build && npm run preview &
```

Confirm Chrome MCP available: `mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_pages`

## Pages to audit (5 Astro + 5 WP)

| Page | Astro URL | WP URL |
|------|-----------|--------|
| Home | `http://localhost:4321/` | `https://www.isoc.hk/` |
| News index | `http://localhost:4321/category/news/` | `https://www.isoc.hk/category/news/` |
| News post | `http://localhost:4321/news/board-of-directors-2024-25/` | `https://www.isoc.hk/news/board-of-directors-2024-25/` |
| About | `http://localhost:4321/about/` | `https://www.isoc.hk/about/` |
| Contact | `http://localhost:4321/contact/` | `https://www.isoc.hk/contact/` |

## Steps

### Step 1 — Audit all Astro pages (mobile)

For each Astro URL, use `mcp__plugin_chrome-devtools-mcp_chrome-devtools__lighthouse_audit`:

```
lighthouse_audit({
  url: "http://localhost:4321/",
  strategy: "mobile",
  categories: ["performance", "accessibility", "best-practices", "seo"]
})
```

Repeat for all 5 Astro URLs. Record the four scores for each.

### Step 2 — Audit all Astro pages (desktop)

Repeat Step 1 with `strategy: "desktop"` for all 5 URLs.

### Step 3 — Audit live WP pages (mobile)

Run Lighthouse on the 5 live WP URLs with the same categories:

```
lighthouse_audit({
  url: "https://www.isoc.hk/",
  strategy: "mobile",
  categories: ["performance", "accessibility", "best-practices", "seo"]
})
```

Note: WP scores may be lower due to plugins, ads, tracking scripts.

### Step 4 — Analyse Lighthouse opportunities

For each Astro audit result, review the "Opportunities" section. Common post-migration issues:
- **Serve images in next-gen formats** — PNG/JPG images not converted to WebP
- **Properly size images** — WP-era images served at full resolution
- **Eliminate render-blocking resources** — CSS/JS blocking first paint
- **Reduce unused CSS** — if the WP theme CSS was carried over
- **Text compression** — served without gzip/brotli (may be OK on Netlify)
- **LCP element** — what is the Largest Contentful Paint element? Is it an image that's slow?

Record the top 3 opportunities per page.

### Step 5 — Check SEO score details

The SEO score below 90 often means:
- Missing meta description (already tested in Test 02)
- `<html lang>` attribute issues (already confirmed)
- Links not crawlable

Note any SEO-specific Lighthouse findings that weren't caught by Test 02.

### Step 6 — Check Accessibility score details

Lighthouse accessibility covers:
- Image `alt` attributes
- Form labels
- Color contrast ratios
- ARIA roles

Note any accessibility failures (more detail in Test 08, but capture here for the record).

## Score recording template

Fill in this table:

### Mobile Scores

| Page | Astro Perf | Astro A11y | Astro BP | Astro SEO | WP Perf | WP A11y | WP BP | WP SEO |
|------|-----------|-----------|---------|---------|---------|---------|-------|--------|
| Home | | | | | | | | |
| News index | | | | | | | | |
| News post | | | | | | | | |
| About | | | | | | | | |
| Contact | | | | | | | | |

### Desktop Scores

| Page | Astro Perf | Astro A11y | Astro BP | Astro SEO |
|------|-----------|-----------|---------|---------|
| Home | | | | |
| News index | | | | |
| News post | | | | |
| About | | | | |
| Contact | | | | |

## Success criteria

Write `validation/reports/07-lighthouse.md` with:

1. **Score tables** (filled in from above)
2. **Regression flags** — any Astro score that is *lower* than the WP score for the same page
3. **Top 3 Opportunities** for the Astro site across all pages (prioritised by impact)
4. **Key metrics to track** for the production deploy (LCP target: <2.5s on mobile, CLS: <0.1)

Expected outcomes:
- Astro Performance score should be ≥ WP score (often significantly higher)
- Astro SEO score may be lower than WP if `<html lang>` and `og:image` bugs are unfixed
- Astro Accessibility score depends on template quality

## Output file

`validation/reports/07-lighthouse.md`

## If you get stuck

- If `lighthouse_audit` is not available in the MCP tool schema: use the `chrome-devtools-mcp:debug-optimize-lcp` skill or `evaluate_script` to run a Lighthouse programmatic audit.
- If the local preview server is too slow for Lighthouse (network throttling makes it look bad): note this and compare only the WP scores, or run Lighthouse on both with throttling disabled.
- If WP site is inaccessible: skip WP comparison and just capture Astro baseline scores.
- Lighthouse mobile strategy uses CPU/network throttling — scores will be lower than desktop. That is expected.
