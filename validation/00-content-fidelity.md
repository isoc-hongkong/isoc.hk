# Test 00 — Content Fidelity Scan

**Effort:** ~2 min | **Prereqs:** None | **Tools:** Bash, Read

## Goal

Scan all 297 markdown content files in `src/content/` for WordPress-era artifacts that indicate the AI-conversion pass produced broken content. This is the highest-value test — it runs in seconds with no server, and already-confirmed bugs (double-escaped HTML entities) prove real issues exist.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Content collections: `src/content/news/` (271 files) and `src/content/pages/` (26 files)
- The site was migrated from WordPress to Astro in a single AI pass. Typical one-pass conversion bugs: unresolved shortcodes, WP block comment remnants, double-escaped HTML entities in frontmatter fields, stray `\r` line endings, broken markdown tables from WP table HTML, BOM characters.

## Already-known issues (confirm and measure)

- **Double-escaped entities:** Post excerpts in built HTML show `&amp;#8216;` instead of `'`. Root cause is likely HTML entities in the `excerpt:` or `description:` frontmatter fields that were entity-encoded twice during migration. Quantify how many files are affected.
- **WP block comments:** Look for `<!-- wp:` block editor comments that should have been stripped.

## Steps

Run all greps from the repo root. For each, record the count of matching files and list up to 10 example paths in the report.

### Step 1 — WP block comments
```bash
grep -rl "<!-- wp:" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
grep -rl "<!-- wp:" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | head -10
```

### Step 2 — WP shortcodes
```bash
grep -rEl "\[caption|\[gallery|\[embed|\[vc_|\[shortcode" \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
grep -rEl "\[caption|\[gallery|\[embed|\[vc_|\[shortcode" \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | head -10
```

### Step 3 — Double-escaped HTML entities (main signal)
```bash
# In markdown body
grep -rl "&amp;#" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
grep -rl "&amp;#" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | head -10

# In frontmatter excerpt/description fields specifically
grep -rn "&amp;" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ \
  | grep -E "^.*:(excerpt|description):" | head -20
```

### Step 4 — WP upload paths in content
```bash
grep -rl "wp-content/uploads" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
grep -rl "wp-content/uploads" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | head -10
```

### Step 5 — WP CSS classes in content
```bash
grep -rl 'class="wp-' /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
grep -rl 'class="wp-block\|class="wp-image\|class="wp-caption' \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | head -10
```

### Step 6 — Stray carriage returns (Windows line endings)
```bash
grep -rlP "\r" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
```

### Step 7 — BOM characters
```bash
grep -rlP "^\xEF\xBB\xBF" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/ | wc -l
```

### Step 8 — Frontmatter completeness
Every file in `src/content/news/` should have `wpId`, `title`, `slug`, `date`, `lang` in its frontmatter.
```bash
# Files missing wpId
grep -rL "^wpId:" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/news/ | head -10
# Files missing lang
grep -rL "^lang:" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/news/ | head -10
# Files missing date
grep -rL "^date:" /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/news/ | head -10
```

### Step 9 — Spot-check Chinese-slug posts
Pick 5 files whose filename contains non-ASCII or long Chinese-romanized slugs. Read the first 50 lines of each. Look for: mojibake, broken markdown tables (raw HTML `<table>` that should be markdown), large walls of HTML instead of clean markdown, missing or garbled content.

Example files to spot-check:
- `src/content/news/metashumagongminwangluoanquanxianggangluntan.md`
- `src/content/news/dangkaifangshujuyushangquyihui.md`
- `src/content/news/hkigf-xiangganghulianwangguanzhiluntan-wangjinshidai.md`
- `src/content/news/baohuercichuangzuo-xifanghuomianyantaohui.md`
- `src/content/news/xiangganghulianwangxiehui-wangkaiyimian-xilie-qingqiongfuwengyinbei.md`

```bash
head -50 /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/news/metashumagongminwangluoanquanxianggangluntan.md
```

### Step 10 — Spot-check image-heavy post
```bash
head -80 "/Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/news/10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk.md"
```
Look for: tables with `![](...)` images — are the Markdown table pipes (`|`) intact? Are `---` horizontal rules correct?

## Success criteria

Write `validation/reports/00-content-fidelity.md` with:

1. **Summary** — overall pass / warn / fail
2. **Issue table:**

| Issue class | Files affected | Severity | Remediation |
|-------------|---------------|----------|-------------|
| Double-escaped entities | N | Warn/Block | Run entity-decode script over frontmatter |
| WP block comments | N | Cosmetic | Strip `<!-- wp:...-->` lines |
| … | … | … | … |

Severity key: **Block** (breaks rendering), **Warn** (visible corruption), **Cosmetic** (invisible to visitors).

3. **Sample paths** for each issue class (up to 10)
4. **Spot-check findings** — qualitative notes per file reviewed

## Output file

`validation/reports/00-content-fidelity.md`

## If you get stuck

- If `grep -P` fails (BSD grep on macOS lacks `-P`): install ripgrep (`brew install ripgrep`) and use `rg` instead.
- If a content file fails to parse: note the path and move on — the Astro build would have caught a parse error.
