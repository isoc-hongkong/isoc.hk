# CLAUDE.md

Orientation for AI agents working on this repo.

## What this is

Static site for the **Internet Society Hong Kong Chapter** (isoc.hk), built with Astro. Migrated from WordPress; legacy URL shapes are preserved via Netlify redirects.

## Stack

- **Astro 6.4** with `@astrojs/mdx` and `@astrojs/sitemap`
- **Node ≥ 22.12** (Netlify pins to Node 22 in `netlify.toml`)
- **Pagefind 1.5** for client-side search (built post-Astro in the `build` script, indexes `dist/`)
- **Sharp** (transitive via Astro) for image processing
- **Stripe Checkout** (client-redirect flow) for membership/donation pages
- **Netlify Forms** for the contact form (`/contact/`)

No React/Vue/etc. — pure Astro components + small inline `<script>` blocks.

## Commands

```sh
npm run dev      # Astro dev server on :4321
npm run build    # astro build + pagefind index (must run in this order)
npm run preview  # serve dist/ locally

# Image pipeline (run after adding new files under public/images/uploads/)
node scripts/convert-uploads-to-webp.mjs            # idempotent; skips up-to-date
node scripts/convert-uploads-to-webp.mjs --dry-run  # report only
node scripts/convert-uploads-to-webp.mjs --limit 10 # sanity-check first 10
```

There is no test runner, linter, or type-check script configured. Use `npx astro check` if you need TS diagnostics.

## Project layout

```
astro.config.mjs              # site URL, trailing slash, MDX, rehype plugin wiring
netlify.toml                  # build config + ~300 WP→Astro redirect rules
public/
  images/uploads/             # GITIGNORED. WordPress media library mirror.
                              #   .webp siblings live next to the .jpg/.png originals
  external/                   # WP-era hotlinks captured into the repo (e.g. /external/bo.eventmasterapp.com/...)
                              #   Referenced from a handful of news posts. Not gitignored.
  images/ui/                  # Favicons, apple-touch-icons. Tracked.
scripts/
  convert-uploads-to-webp.mjs # Bulk WebP generator (sharp-based, idempotent)
  rehype-uploads-picture.mjs  # Rehype plugin: rewrites markdown <img> to <picture>+WebP
src/
  content.config.ts           # Astro Content Collections: `news` and `pages` schemas
  content/
    news/*.md                 # ~600 posts, frontmatter described below
    pages/*.md                # ~70 static pages (About, donate tiers, etc.)
  layouts/
    BaseLayout.astro          # <html>/<head>, OG/Twitter meta, LCP preload, favicons
    PageLayout.astro          # Wraps BaseLayout with Header + Footer + main slot
  components/
    Header.astro              # Top nav with mobile burger + CSS background
    Footer.astro              # Site footer; logo uses CSS filter invert
    Picture.astro             # <picture> wrapper for featuredImage strings
    StripeCheckoutButton.astro # Stripe.js redirect-to-checkout button
  pages/
    index.astro               # Home: hero + 12 most-recent news cards
    news/index.astro          # All-news index
    news/[slug].astro         # Single post (uses post.data.slug as the route param)
    category/[slug]/index.astro # Category archive
    contact/index.astro       # Contact form (Netlify Forms)
    search/index.astro        # Pagefind-powered search UI
    [...slug].astro           # Single page rendering (params.slug = page.data.slug)
    404.astro
  styles/global.css           # CSS variables (brand colors), base resets, shared post-card styles
```

## Content collections

Defined in `src/content.config.ts` via the `glob` loader. **The `data.slug` field is what's used in URLs**, not the filename — keep them in sync when adding posts.

### `news` (collection)

```ts
{
  wpId: number,                 // legacy WP post ID (don't reuse, used for redirect mapping)
  title: string,
  slug: string,                 // URL slug (URL → /news/<slug>/)
  originalSlug?: string,        // WP percent-encoded slug for fallback redirects
  date: Date,                   // sort order
  modified?: Date,
  excerpt: string,              // shown on cards
  description: string,          // <meta name="description">
  categories: string[],         // slugs; first one shown in breadcrumb
  tags: string[],
  featuredImage?: string,       // absolute path like /images/uploads/2017/11/HT-18-1.jpg
  featuredImageAlt?: string,
  lang: 'zh-Hant' | 'en' | 'mixed',
  draft: boolean,               // filtered out by all queries
}
```

### `pages` (collection)

```ts
{
  wpId: number,
  title: string,
  slug: string,                 // URL slug (URL → /<slug>/)
  parent?: string,              // breadcrumb parent slug
  description: string,
  lang: 'zh-Hant' | 'en' | 'mixed',
  stripePlan?: {                // when set, [...slug].astro renders a StripeCheckoutButton
    planId: string,
    label: string,
    successUrl: string,
    cancelUrl: string,
  }
}
```

Content is bilingual (Traditional Chinese + English, frequently mixed in a single post). The HTML lang attribute is set per page/post from the `lang` field.

## Image pipeline (the thing most likely to bite you)

The uploads directory is **gitignored**. Anyone running a fresh clone won't have the 800+ media files locally; the build still completes but image URLs 404. There's no automated sync — files arrive via whatever out-of-band mechanism the operator uses (rsync from old WP host, Netlify large-media bucket, etc.). Confirm with the operator before assuming images are missing.

When images **are** present, the pipeline is:

1. **Generation.** `scripts/convert-uploads-to-webp.mjs` walks `public/images/uploads/` and emits a `.webp` sibling next to every `.jpg`/`.jpeg`/`.png`. Idempotent — skips if `.webp` is newer than source. Uses `alphaQuality: 100` for files with alpha (logos) and `quality: 80` otherwise.

2. **Markdown content.** `scripts/rehype-uploads-picture.mjs` is wired into `astro.config.mjs` as a rehype plugin. At build time, it rewrites any `<img src="/images/uploads/...{jpg,jpeg,png}">` into `<picture><source srcset=".webp" type="image/webp"><img loading="lazy" decoding="async" ...></picture>`, but **only when the `.webp` sibling exists on disk**. Falls back gracefully when it doesn't. Doesn't touch `/external/...` or absolute http URLs.

3. **Featured images (frontmatter strings).** `featuredImage` is a string path, not an `astro:assets` import, so it bypasses Astro's image optimizer. Use the `<Picture>` component (`src/components/Picture.astro`) for these — same WebP-sibling logic as the rehype plugin. Already wired into `index.astro`, `news/index.astro`, and `news/[slug].astro`.

4. **Layout images.** The header background (`header-isoc.webp`, LCP element on every page) and the ISOC HK logo are referenced as `.webp` directly in `BaseLayout.astro` (preload), `Header.astro` (CSS bg + nav img), and `Footer.astro` (footer img). WebP support is universal in browsers active in 2026 — no PNG fallback layer at this level.

**When adding a new image**, drop the original into `public/images/uploads/<year>/<month>/...` and run the conversion script. The build will pick up the new `.webp` automatically.

**Do not** try to migrate `public/` images to `src/assets/` + `astro:assets` `<Image />` in bulk — `featuredImage` strings can't be imported as ES modules, and the existing `<picture>` flow already covers format + lazy-loading. Responsive `srcset`/`sizes` is a deferred future enhancement.

## Routing & redirects

- Page routes come from `src/pages/*.astro` and the dynamic `[...slug].astro` (uses `page.data.slug`, not the filename).
- Post routes are `/news/<slug>/` from `news/[slug].astro`.
- Category routes are `/category/<slug>/` from `category/[slug]/index.astro`.
- `trailingSlash: 'always'` is enforced — when adding links, always include the trailing slash.
- **Legacy WP URLs** (e.g. `/?p=123`, `/2015/03/15/some-post/`, `/feed/`, `/tag/<slug>/`, CJK-encoded paths) are handled in `netlify.toml`. The redirect ordering is intentional — read the section banners before reordering rules. New post slugs do **not** require a redirect rule; rules are only for paths the WordPress site used to serve.

## Deployment

- **Netlify**, building from this repo. `command = "npm run build"`, publishes `dist/`.
- The contact form uses Netlify Forms (the form tag has `data-netlify="true"` and a `bot-field` honeypot).
- Stripe Checkout uses a hardcoded **publishable** key in `StripeCheckoutButton.astro` — safe to expose, but if you rotate it, update the default prop.
- The site is canonicalized at `https://www.isoc.hk` (set via `site` in `astro.config.mjs` — used by sitemap and `<link rel="canonical">`).

## Gotchas

- **Content collection cache.** Astro caches collection schemas in `.astro/`. If you change `src/content.config.ts` and the build behaves oddly, blow away `.astro/` and rebuild.
- **HTML in markdown.** The migrated markdown contains a lot of raw HTML (tables, `<br>`, attribute markup) carried over from WordPress. Astro's markdown renderer passes it through. Don't assume the corpus is clean Markdown.
- **Mixed-language pages.** Setting `lang: 'mixed'` falls back to `zh-Hant` for the `<html lang>` attribute (see how `news/[slug].astro` resolves it). Pick `zh-Hant`, `en`, or `mixed` deliberately.
- **`featuredImage` is optional.** Don't assume every post has one — guard with `{post.data.featuredImage && (...)}` like the existing templates do.
- **Pagefind needs `dist/`.** The `build` script chains `astro build && npx pagefind --site dist`. If you only run `astro build`, search will 404 in the resulting site.
- **`public/external/` is referenced from content.** A handful of news posts (search for `/external/bo.eventmasterapp.com`) link images from this directory. Don't delete it.
- **Trailing slashes.** With `trailingSlash: 'always'`, links without the slash will redirect — write them with the slash from the start.
- **Brand colors live in CSS variables** (`src/styles/global.css`): `--color-teal`, `--color-teal-dark`, `--color-teal-light`, `--color-navy`. Use these rather than hex literals when styling new components.
