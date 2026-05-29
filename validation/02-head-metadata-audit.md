# Test 02 — `<head>` Metadata + HTML Lang Audit

**Effort:** ~5 min | **Prereqs:** `dist/` built | **Tools:** Bash, Read

## Goal

Parse the `<head>` section of every built page in `dist/` to verify: unique page titles, meta descriptions, correct canonical URLs, Open Graph tags, and correct `<html lang>` attribute. SEO and social sharing correctness lives entirely in `<head>`.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Built output: `dist/` (334 `index.html` files)
- Site URL: `https://www.isoc.hk`
- `trailingSlash: 'always'` — all canonical URLs should end in `/`
- Content frontmatter has a `lang` field (`en` or `zh-hant`)

**Already-confirmed bugs:**
1. Home page (`dist/index.html`) has `<html lang="zh-Hant">` but is in English — the `lang` attribute is hardcoded to the wrong value.
2. `og:image` appears absent on all pages — social share previews will have no image.

This test confirms the scope of both bugs and finds others.

## Steps

### Step 1 — Extract title from every page

```bash
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" | while read f; do
  path="${f#/Users/chpapa/Workspaces/isoc.hk/astro-site/dist}"
  path="${path%/index.html}/"
  title=$(grep -o '<title>[^<]*</title>' "$f" | sed 's/<title>//;s/<\/title>//')
  echo "$path|$title"
done > /tmp/page_titles.txt
wc -l /tmp/page_titles.txt
```

**Check for duplicate titles** (indicates truncated migration or generic fallback):
```bash
cut -d'|' -f2 /tmp/page_titles.txt | sort | uniq -d | head -20
```

**Check for empty titles:**
```bash
grep '|$' /tmp/page_titles.txt | wc -l
grep '|$' /tmp/page_titles.txt | head -10
```

**Spot-check: title should be "Post Title | Internet Society Hong Kong"**
```bash
head -20 /tmp/page_titles.txt
```

### Step 2 — Check meta description presence

```bash
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" | while read f; do
  path="${f#/Users/chpapa/Workspaces/isoc.hk/astro-site/dist}"
  path="${path%/index.html}/"
  has_desc=$(grep -c 'name="description"' "$f" || echo 0)
  echo "$path|$has_desc"
done | grep '|0$' > /tmp/missing_desc.txt

wc -l /tmp/missing_desc.txt
cat /tmp/missing_desc.txt | head -20
```

### Step 3 — Audit canonical URL correctness

```bash
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" | while read f; do
  path="${f#/Users/chpapa/Workspaces/isoc.hk/astro-site/dist}"
  path="${path%/index.html}/"
  expected="https://www.isoc.hk${path}"
  canonical=$(grep -o 'rel="canonical" href="[^"]*"' "$f" | grep -o 'href="[^"]*"' | sed 's/href="//;s/"//')
  if [ "$canonical" != "$expected" ]; then
    echo "MISMATCH: $path | expected: $expected | got: $canonical"
  fi
done > /tmp/canonical_mismatches.txt

wc -l /tmp/canonical_mismatches.txt
cat /tmp/canonical_mismatches.txt | head -20
```

### Step 4 — Audit `<html lang>` attribute

```bash
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" | while read f; do
  path="${f#/Users/chpapa/Workspaces/isoc.hk/astro-site/dist}"
  path="${path%/index.html}/"
  lang=$(grep -o '<html lang="[^"]*"' "$f" | grep -o 'lang="[^"]*"' | sed 's/lang="//;s/"//')
  echo "$path|$lang"
done > /tmp/page_langs.txt

# Show unique lang values and how many pages each
cut -d'|' -f2 /tmp/page_langs.txt | sort | uniq -c | sort -rn
```

Cross-reference with frontmatter. For a sample of 10 news posts that have `lang: zh-hant` in their frontmatter, check whether the built page has the correct `<html lang>`:

```bash
# Find a zh-hant news post
grep -rl "^lang: zh" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/news/ | head -5
```

Then for each found slug, check the corresponding `dist/news/<slug>/index.html` lang attribute.

### Step 5 — Check Open Graph tags

```bash
# Pages missing og:image (expected to be most/all pages)
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" \
  | xargs grep -L 'property="og:image"' | wc -l

# Pages missing og:title
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" \
  | xargs grep -L 'property="og:title"' | wc -l

# Pages missing og:description
find /Users/chpapa/Workspaces/isoc.hk/astro-site/dist -name "index.html" \
  | xargs grep -L 'property="og:description"' | wc -l
```

### Step 6 — Spot-check 5 pages against live WP titles

Use WebFetch to fetch each of these live URLs and extract the `<title>`:

- `https://www.isoc.hk/about/`
- `https://www.isoc.hk/news/board-of-directors-2024-25/`
- `https://www.isoc.hk/be-our-members/`
- `https://www.isoc.hk/hkigf/`
- `https://www.isoc.hk/contact/`

Compare each WP title against the Astro-built title from Step 1. Note regressions (e.g., title truncated, title missing site name suffix, different capitalization).

### Step 7 — Root cause analysis

After collecting data, identify root causes in the Astro source:

```bash
# Find the layout file that sets lang
grep -rn "lang=" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/components/ | head -20
grep -rn "lang=" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/pages/ | head -20
# Find where og:image is (or isn't) set
grep -rn "og:image" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/ | head -10
```

## Success criteria

Write `validation/reports/02-head-metadata-audit.md` with:

1. **Summary** — pass / warn / fail per category
2. **Issue table:**

| Issue | Pages affected | Root cause (file:line) | Severity | Fix |
|-------|---------------|----------------------|----------|-----|
| Wrong `<html lang>` | N | `src/layouts/...astro:NN` | Block | Derive lang from frontmatter |
| Missing `og:image` | N | Not set in layout | Warn | Add default OG image |
| … | … | … | … | … |

3. **Canonical mismatches** if any (should be zero)
4. **Duplicate titles** list
5. **Live WP title comparison** findings (5 pages)

## Output file

`validation/reports/02-head-metadata-audit.md`

## If you get stuck

- `xargs grep -L` may fail on some macOS versions with many files. Use a `while read` loop instead.
- The `<html lang>` attribute may use `zh-Hant` (capital H) in the Astro output but `zh-hant` (lowercase) in frontmatter — treat these as equivalent for matching.
- If WebFetch is rate-limited for the live site, just note the titles you can retrieve and note timeouts.
