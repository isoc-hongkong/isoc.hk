# Report 00 — Content Fidelity Scan

**Date:** 2026-05-29  
**Status:** FIXED — entity decoding applied 2026-05-29 via `scripts/fix-content-entities.mjs`  
**Repo:** `/Users/chpapa/Workspaces/isoc.hk/astro-site`  
**Files scanned:** 297 (271 in `src/content/news/`, 26 in `src/content/pages/`)

---

## Summary — WARN

No blocking WordPress artifacts remain (no `<!-- wp:` comments, no shortcodes, no `wp-content/uploads` paths, no `class="wp-"` attributes, no carriage returns, no BOM characters). All required frontmatter fields (`wpId`, `title`, `slug`, `date`, `lang`) are present in every news file.

HTML entities in frontmatter and body have been decoded. See fix summary below.

**Remaining issue:** 76 files contain external image URLs pointing to third-party domains that likely no longer serve those assets (deferred).

---

## Fix Applied: `scripts/fix-content-entities.mjs`

Run 2026-05-29. Decoded HTML entities in frontmatter `title`/`excerpt`/`description` and markdown body. Single commit for clean rollback.

| Field | Files fixed |
|---|---|
| Frontmatter `title` | 97 |
| Frontmatter `excerpt` | 161 |
| Frontmatter `description` | 156 |
| Markdown body | 1 |
| **Total files changed** | **192 / 297** |

Note: the "191 body files" in the original scan was a false count — the grep searched the whole file including frontmatter. Only 1 file actually had an entity in the markdown body.

## Issue Table (post-fix)

| Issue class | Files affected | Severity | Status |
|---|---|---|---|
| HTML entities in frontmatter `title`/`excerpt`/`description` | ~~97 / 161 / 156~~ → **0** | Warn | **FIXED** |
| `&nbsp;`-prefixed excerpts | ~~36~~ → **0** | Warn | **FIXED** |
| HTML entities in markdown body | ~~1~~ → **0** | Cosmetic | **FIXED** |
| External image URLs in content body | **76 / 297** | **Warn** | Open — deferred |
| WP block comments (`<!-- wp:`) | 0 | — | n/a |
| WP shortcodes (`[caption]`, `[gallery]`, etc.) | 0 | — | n/a |
| Double-escaped entities (`&amp;#…`) in body | 0 | — | n/a |
| `wp-content/uploads` paths | 0 | — | n/a |
| `class="wp-*"` attributes | 0 | — | n/a |
| Carriage returns (`\r`) | 0 | — | n/a |
| BOM characters | 0 | — | n/a |
| Missing `wpId` | 0 | — | n/a |
| Missing `lang` | 0 | — | n/a |
| Missing `date` | 0 | — | n/a |

**Severity key:** **Block** (breaks rendering) · **Warn** (visible corruption or broken assets) · **Cosmetic** (invisible to visitors)

---

## Step-by-Step Results

### Step 1 — WP block comments: 0 files ✓
No `<!-- wp:` remnants found.

### Step 2 — WP shortcodes: 0 files ✓
No `[caption]`, `[gallery]`, `[embed]`, `[vc_*]`, or `[shortcode]` found.

### Step 3 — Double-escaped entities (`&amp;#`): 0 files in body ✓
The specific double-encoding pattern (`&amp;#8216;` etc.) is absent from markdown bodies. However, HTML entities **are** present in frontmatter `excerpt`/`description` fields — 173 files affected (see issue table). Representative examples:

- `excerpt: "&nbsp; SecureHongKong 2016 ... &amp; Technology ..."`
- `excerpt: "Results Announcement of the &#8220;Hong Kong SMEs Cloud Adoption, Security &amp; Privacy Readiness Survey&#8221;"`
- `excerpt: "IPv6 Forum ... research &amp; Education Networks ..."`

### Step 4 — WP upload paths: 0 files ✓
No `wp-content/uploads` strings found — paths were correctly rewritten to `/images/uploads/`.

### Step 5 — WP CSS classes: 0 files ✓
No `class="wp-block"`, `class="wp-image"`, or `class="wp-caption"` found.

### Step 6 — Carriage returns: 0 files ✓

### Step 7 — BOM characters: 0 files ✓

### Step 8 — Frontmatter completeness: all present ✓
Every file in `src/content/news/` has `wpId`, `lang`, and `date`.

---

## Sample Paths — HTML Entities in Frontmatter (up to 10)

```
src/content/news/10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk.md
src/content/news/211.md
src/content/news/2174.md
src/content/news/2254.md
src/content/news/239.md
src/content/news/267.md
src/content/news/2911.md
src/content/news/301.md
src/content/news/3119.md
src/content/news/4909.md
```

---

## Sample Paths — External Images in Content Body (up to 10)

```
src/content/news/zhangwoqushi-qianjingwuxian-zixunjitongxunkejijiangzuoxilieer.md
src/content/news/world-internet-developer-summit-wids-save-the-date-7-8-june-hk.md
src/content/news/isoc-hk-supported-events-feb-13-joint-ict-spring-dinner-ux-hong-kong-education-2-9-conference-cisco-connect-hong-kong.md
src/content/news/ipv6world-asia-after-world-ipv6-day-whats-next-2-sep-11.md
src/content/news/internet-saturday-3-bokeyanlunwuziyou-16-jul-11.md
src/content/news/securehongkong-2016.md
src/content/news/fred-bakers-talk-the-internet-of-things.md
src/content/news/zhangwoqushi-qianjingwuxian-zixunjitongxunkejijiangzuo-xilie.md
src/content/news/call-for-application-best-ict-startup-award-chengyaocanjia-zuijiazixunkejichuchuangqiyejiang.md
src/content/news/startlab-hk-xianggangchuangyeshiyanshi.md
```

The most extreme case is `10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk.md`, whose entire body is a markdown-pipe table of external images from `bo.eventmasterapp.com` — all image paths are external third-party URLs.

---

## Spot-Check Findings

### 1. `metashumagongminwangluoanquanxianggangluntan.md`
- Frontmatter: clean — no HTML entities; `excerpt` and `description` are plain Chinese text.
- Body: Clean markdown paragraphs, no HTML tables, no external images.
- **Status: PASS**

### 2. `dangkaifangshujuyushangquyihui.md`
- Frontmatter: clean.
- Body: Clean markdown with proper `**bold**` formatting, inline links. No tables.
- **Status: PASS**

### 3. `hkigf-xiangganghulianwangguanzhiluntan-wangjinshidai.md`
- Frontmatter: clean.
- Body: Clean paragraphs, inline links. One image (local `/images/uploads/`).
- **Status: PASS**

### 4. `baohuercichuangzuo-xifanghuomianyantaohui.md`
- Frontmatter: `excerpt` starts with `&nbsp;` noise.
- Body: Markdown pipe table with `|` pipes intact. Local images only. Table formatting is functional.
- **Status: WARN** (frontmatter entity noise)

### 5. `xiangganghulianwangxiehui-wangkaiyimian-xilie-qingqiongfuwengyinbei.md`
- Frontmatter: title contains `&#8211;` (en-dash) and `&quot;`.
- Body: Clean paragraphs, local images.
- **Status: WARN** (title has numeric entities — may display literally in `<title>` tag depending on template handling)

### 6. `10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk.md` (image-heavy)
- Frontmatter: `excerpt`/`description` contain `&nbsp;`, `&#39;` entities.
- Body: Entire content is a large markdown pipe table (`|...|...|`) with images from `bo.eventmasterapp.com`. Table pipes are intact; `---` separators are correct. However, all images point to an external domain that is very likely to return 404 — this post will show a wall of broken images.
- **Status: WARN** (external images; frontmatter entities)

---

## Recommended Next Steps (Priority Order)

1. **HTML entities in frontmatter** (173 files): Write a script that reads YAML frontmatter and decodes HTML entities in `excerpt`, `description`, and `title` fields using an HTML entity decoder. Python `html.unescape()` or Node `he.decode()` would suffice. This affects `<meta name="description">` and OG tags.

2. **External images** (76 files): Audit which domains are unreachable, then either mirror the images locally or remove broken image references. Priority: posts with `eventmasterapp.com` images (the 10th anniversary post is the worst offender).

3. **`&nbsp;`-prefixed excerpts** (36 files): Strip leading whitespace/entity noise from excerpt values as part of the frontmatter decode pass in item 1.
