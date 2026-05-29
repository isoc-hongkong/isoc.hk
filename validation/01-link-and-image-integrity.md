# Test 01 — Internal Link & Image Integrity

**Effort:** ~5 min | **Prereqs:** `dist/` built | **Tools:** Bash, WebFetch

## Goal

Find internal links that 404 and external images that are dead. The WP migration likely left many posts referencing images on WordPress-era CDNs (`bo.eventmasterapp.com`, `isoc-hk.s3.*`, old `wp-content/uploads/` paths). Visitors see broken images; search engines see dead links.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Built output: `dist/` (334 `index.html` files)
- The site has `trailingSlash: 'always'` — all internal URLs should end in `/`
- `netlify.toml` defines redirect rules that count as "reachable" even if not in `dist/`
- Content posts contain images from at least two external WP-era hosts: `bo.eventmasterapp.com` and potentially `isoc-hk.s3.*`

## Steps

### Step 1 — Extract all internal hrefs from built HTML

```bash
# Extract all href values starting with / (internal links)
grep -oh 'href="\/[^"]*"' /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/**/*.html \
  | sed 's/href="//;s/"//' \
  | sort -u > /tmp/internal_links.txt
wc -l /tmp/internal_links.txt
```

If glob doesn't work (zsh), use:
```bash
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "*.html" -exec \
  grep -oh 'href="\/[^"]*"' {} \; \
  | sed 's/href="//;s/"//' | sort -u > /tmp/internal_links.txt
```

### Step 2 — Build the set of reachable paths

```bash
# Every path that has a dist/index.html
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" \
  | sed 's|/Users/chpapa/Workspaces/isoc.hk/astro-site/dist||;s|/index.html|/|' \
  | sort -u > /tmp/astro_paths.txt
# Add root
echo "/" >> /tmp/astro_paths.txt

# Extract redirect `from` targets from netlify.toml (non-query-string rules)
grep '^  from' /Users/chpapa/Workspaces/isoc.hk/astro-site/netlify.toml \
  | grep -v 'query' | sed 's/.*= "//;s/".*//' \
  | sort -u > /tmp/redirect_froms.txt

wc -l /tmp/astro_paths.txt /tmp/redirect_froms.txt
```

### Step 3 — Find broken internal links

```bash
# Links in internal_links.txt that are NOT in astro_paths.txt or redirect_froms.txt
comm -23 \
  <(cat /tmp/internal_links.txt | sort) \
  <(cat /tmp/astro_paths.txt /tmp/redirect_froms.txt | sort -u) \
  > /tmp/broken_internal.txt

wc -l /tmp/broken_internal.txt
cat /tmp/broken_internal.txt
```

For each broken link, find which pages link to it:
```bash
head -5 /tmp/broken_internal.txt | while read LINK; do
  echo "=== $LINK ==="
  grep -rl "href=\"$LINK\"" /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/ | head -3
done
```

### Step 4 — Extract all external image/script sources

```bash
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "*.html" -exec \
  grep -oh 'src="https://[^"]*"' {} \; \
  | sed 's/src="//;s/"//' | sort -u > /tmp/external_srcs.txt

# Also extract from markdown content (these may not be in built output if images failed)
grep -roh 'https://[^ )\"]*\.\(jpg\|jpeg\|png\|gif\|webp\|svg\)' \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ \
  | sort -u >> /tmp/external_srcs.txt

sort -u /tmp/external_srcs.txt > /tmp/external_srcs_uniq.txt
wc -l /tmp/external_srcs_uniq.txt
```

### Step 5 — Identify unique external image hosts

```bash
sed 's|https://||;s|/.*||' /tmp/external_srcs_uniq.txt | sort | uniq -c | sort -rn | head -20
```

Note any hosts that look like WP-era or third-party CDNs (e.g., `bo.eventmasterapp.com`, `isoc-hk.s3.*`, `pandaform.com`, `eventmasterapp.com`).

### Step 6 — HEAD-check a sample of external images

For each unique external host identified in Step 5, test 3 sample URLs with a 5-second timeout:

```bash
# Replace with actual URLs found in Step 5
curl -sI --max-time 5 "https://bo.eventmasterapp.com/images/upload/images/banner_website%281%29.png" \
  | grep -E "^HTTP|^Location"
```

Check whether the host returns 200 (alive), 404 (dead page), or connection refused / timeout (dead host).

### Step 7 — Find `wp-content/uploads` references in source

```bash
grep -rn "wp-content/uploads" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ \
  | wc -l
grep -rn "wp-content/uploads" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ \
  | head -20
```

These paths need one of: (a) a file under `public/images/uploads/...` matching the WP path, (b) a `netlify.toml` redirect from `/wp-content/uploads/...` to the asset's new location, or (c) replacement with the correct new URL.

Check if assets actually exist under public:
```bash
ls /Users/chpapa/Workspaces/isoc.hk/astro-site/public/images/uploads 2>/dev/null | head -20 \
  || echo "No public/images/uploads directory"
```

### Step 8 — Check favicon and UI assets

```bash
ls /Users/chpapa/Workspaces/isoc.hk/astro-site/public/images/ui/ 2>/dev/null \
  || echo "Missing public/images/ui/ — favicon PNGs and apple-touch-icons will 404"
```

The built HTML references `/images/ui/favicon-32x32.png`, `/images/ui/apple-touch-icon-57x57.png`, etc.

## Success criteria

Write `validation/reports/01-link-and-image-integrity.md` with:

1. **Summary** — overall pass / warn / fail
2. **Broken internal links** — count, list, which pages link to them
3. **Dead external image hosts** — host, status code, sample URLs affected
4. **`wp-content/uploads` references** — count, sample paths, whether public/ has them
5. **Missing UI assets** — which favicon/icon files are absent
6. **Recommended fixes** per issue class

## Output file

`validation/reports/01-link-and-image-integrity.md`

## If you get stuck

- The `dist/**/*.html` glob may not work in all shells. Use `find ... -name "*.html"` instead.
- If `curl` HEAD checks are slow, limit to 5 samples per host and note that a full check would require a proper crawler.
- If `comm` gives errors, sort both inputs explicitly: `sort file1 > /tmp/a; sort file2 > /tmp/b; comm -23 /tmp/a /tmp/b`.
