# Test 05 — Visual Regression (Desktop / Tablet / Mobile)

**Effort:** ~20 min | **Prereqs:** Preview server running + Chrome DevTools MCP | **Tools:** chrome-devtools MCP

## Goal

Compare screenshots of 12 representative pages side-by-side between the live WordPress site and the local Astro preview. Catch layout breaks, missing elements, wrong typography, broken images, and mobile responsiveness issues that automated tests miss.

## Context

- Live WP site: `https://www.isoc.hk`
- Local Astro preview: `http://localhost:4321` (start with `npm run preview`)
- Astro dev server also works: `http://localhost:4321` (start with `npm run dev`)
- Working directory: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Screenshots save to: `validation/reports/screenshots/`

## Prerequisites

### 1. Start preview server
```bash
cd /Users/chpapa/Workspaces/isoc.hk/astro-site
npm run preview &
# Wait ~5s; server starts at http://localhost:4321
```
If `dist/` is missing, run `npm run build` first (this also builds the pagefind index).

### 2. Verify Chrome DevTools MCP is connected
Use `mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_pages` to confirm Chrome is available. If it returns an error, see the `chrome-devtools-mcp:troubleshooting` skill.

### 3. Create screenshots directory
```bash
mkdir -p /Users/chpapa/Workspaces/isoc.hk/astro-site/validation/reports/screenshots
```

## Pages to test (12 total)

| # | Page type | WP URL | Astro URL |
|---|-----------|--------|-----------|
| A | Home | `https://www.isoc.hk/` | `http://localhost:4321/` |
| B | News index | `https://www.isoc.hk/category/news/` | `http://localhost:4321/category/news/` |
| C | News post (EN) | `https://www.isoc.hk/news/board-of-directors-2024-25/` | `http://localhost:4321/news/board-of-directors-2024-25/` |
| D | News post (ZH) | `https://www.isoc.hk/news/metashumagongminwangluoanquanxianggangluntan/` | `http://localhost:4321/news/metashumagongminwangluoanquanxianggangluntan/` |
| E | Category page | `https://www.isoc.hk/category/events/` | `http://localhost:4321/category/events/` |
| F | About | `https://www.isoc.hk/about/` | `http://localhost:4321/about/` |
| G | Join Us | `https://www.isoc.hk/be-our-members/` | `http://localhost:4321/be-our-members/` |
| H | Contact | `https://www.isoc.hk/contact/` | `http://localhost:4321/contact/` |
| I | Search | N/A (WP had `/search/`) | `http://localhost:4321/search/` |
| J | Image-heavy post | `https://www.isoc.hk/news/10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk/` | `http://localhost:4321/news/10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk/` |
| K | Static page | `https://www.isoc.hk/disclaimer/` | `http://localhost:4321/disclaimer/` |
| L | 404 | `https://www.isoc.hk/this-does-not-exist/` | `http://localhost:4321/this-does-not-exist/` |

## Viewports

Test each page at:
- **Desktop**: 1440×900
- **Tablet**: 768×1024
- **Mobile**: 375×812 (iPhone SE)

## Steps

For **each page** (A through L), do the following. You can use `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page` and `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot` with `mcp__plugin_chrome-devtools-mcp_chrome-devtools__resize_page` or `mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate`.

### For each page × viewport:

1. Navigate Chrome to the **WP URL**.
2. Set viewport to target size using `mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate` or `mcp__plugin_chrome-devtools-mcp_chrome-devtools__resize_page`.
3. Take screenshot → save to `validation/reports/screenshots/WP-<page-letter>-<viewport>.png`.
4. Navigate to the **Astro local URL**.
5. Take screenshot → save to `validation/reports/screenshots/ASTRO-<page-letter>-<viewport>.png`.
6. Compare visually and note differences.

Example for page A (Home) at desktop:
```
navigate_page → https://www.isoc.hk/
resize_page → 1440x900
take_screenshot → save as WP-A-desktop.png

navigate_page → http://localhost:4321/
resize_page → 1440x900
take_screenshot → save as ASTRO-A-desktop.png
```

### What to look for

For each comparison, check:

**Layout:**
- [ ] Header / nav bar appears correctly (logo, links, hamburger on mobile)
- [ ] Page content is in the correct column (not full-width when it shouldn't be)
- [ ] Footer present with correct links

**Typography:**
- [ ] Heading sizes match the WP version (or are acceptably different)
- [ ] Chinese characters render correctly (no boxes/tofu)
- [ ] Body text line length is readable

**Images:**
- [ ] Hero/feature images load (not broken icons)
- [ ] Post content images load
- [ ] ISOC HK logo loads in header and footer

**Content:**
- [ ] Page title matches
- [ ] Body content is present (not blank / truncated)
- [ ] No raw HTML artifacts visible (e.g., `<br />`, `&amp;`, `<!-- comment -->`)

**Mobile specific:**
- [ ] Navigation hamburger works (tap to open)
- [ ] No horizontal scroll
- [ ] Touch targets are large enough (buttons, links)

**Known issues to verify (not penalize, just confirm):**
- Image-heavy post (page J): The WP-era images are on `bo.eventmasterapp.com` — many may be dead/broken. Note which images load vs. fail.
- ZH post (page D): Verify Chinese text renders without garbling.

## Per-page comparison template

In the report, for each page write:

```
### Page A — Home
**Desktop:** [summary of differences]
**Tablet:** [summary of differences]
**Mobile:** [summary of differences]
**Severity:** PASS / WARN / BLOCK
**Issues:**
- [issue description] — severity tag
```

Severity: **BLOCK** (page is unusable), **WARN** (visible problem, not blocking), **COSMETIC** (minor visual difference).

## Success criteria

Write `validation/reports/05-visual-regression.md` with:

1. **Summary** — pages tested, pass/warn/block counts
2. **Per-page findings** using the template above
3. **Screenshots index** — list of all screenshot files in `validation/reports/screenshots/`
4. **Top issues** — the 3–5 highest-severity visual problems needing a fix PR

## Output file

`validation/reports/05-visual-regression.md`
`validation/reports/screenshots/` (directory of PNG screenshots)

## If you get stuck

- If Chrome DevTools MCP is not available: record "Chrome MCP unavailable" in the report and skip visual screenshots. The test can be done manually instead.
- If the preview server port is not 4321: check the terminal output of `npm run preview` for the actual port. Astro typically logs `Server started at http://localhost:XXXX`.
- If a WP page loads a redirect / login wall: skip the WP comparison for that page and just audit the Astro version.
- If `emulate` is not working for viewport changes: use `resize_page` with explicit width/height instead.
- If screenshots cannot be saved to a file path: take them and describe what you see in the report — the visual assessment is more valuable than the PNG files.
