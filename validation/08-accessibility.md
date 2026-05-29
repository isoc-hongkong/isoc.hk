# Test 08 — Accessibility Audit

**Effort:** ~15 min | **Prereqs:** Preview server running + Chrome DevTools MCP | **Tools:** chrome-devtools MCP, a11y-debugging skill

## Goal

Run a focused accessibility audit on key page types in the Astro site. Covers: semantic HTML structure, ARIA labels, keyboard navigation, tap-target sizes on mobile, and colour contrast for the teal/navy/white brand palette.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Local preview: `http://localhost:4321` (run `npm run preview`)
- Primary template: `src/components/Header.astro`, `src/components/Footer.astro`, `src/pages/[...slug].astro`, `src/pages/news/[slug].astro`
- Brand colours: teal (`#40B2A4`), navy, white — check contrast ratios on teal text/buttons
- Nav toggle button uses `aria-expanded` and `aria-controls` (already implemented in template)

## Prerequisites

```bash
cd /Users/chpapa/Workspaces/isoc.hk/astro-site
npm run build && npm run preview &
```

Optionally use the `chrome-devtools-mcp:a11y-debugging` skill by invoking it at the start of this test.

## Pages to audit

| Page | URL |
|------|-----|
| Home | `http://localhost:4321/` |
| News post (EN) | `http://localhost:4321/news/board-of-directors-2024-25/` |
| News post (ZH) | `http://localhost:4321/news/metashumagongminwangluoanquanxianggangluntan/` |
| Contact | `http://localhost:4321/contact/` |
| Search | `http://localhost:4321/search/` |

## Steps

### Step 1 — Run automated a11y audit via Lighthouse

For each page, run Lighthouse with accessibility category:
```
lighthouse_audit({
  url: "http://localhost:4321/",
  strategy: "mobile",
  categories: ["accessibility"]
})
```

Record the score and all failing audits. Repeat for all 5 pages.

### Step 2 — Check semantic HTML structure

For each page, use `evaluate_script` to check heading hierarchy:
```javascript
// Run in Chrome DevTools evaluate_script
Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
  .map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 60) }))
```

**What to check:**
- Exactly one `<h1>` per page (not zero, not two)
- Headings don't skip levels (e.g., `<h1>` → `<h3>` skipping `<h2>`)
- The `<h1>` contains the page title (not the site name)

### Step 3 — Check image alt attributes

```javascript
// Find images missing alt
Array.from(document.querySelectorAll('img'))
  .filter(img => !img.alt)
  .map(img => ({ src: img.src, class: img.className }))
```

Note: decorative images should have `alt=""` (empty string), not missing `alt`. Both "no alt attribute" and "alt text that is just the filename" are problems.

### Step 4 — Check ARIA on navigation

```javascript
// Check nav toggle has correct ARIA
const toggle = document.getElementById('navToggle');
({
  ariaExpanded: toggle?.getAttribute('aria-expanded'),
  ariaControls: toggle?.getAttribute('aria-controls'),
  ariaLabel: toggle?.getAttribute('aria-label'),
})
```

Expected: `aria-expanded="false"`, `aria-controls="navMenu"`, `aria-label="Toggle navigation"`.

Also check that the nav landmark has `aria-label`:
```javascript
document.querySelector('nav')?.getAttribute('aria-label')
// Expected: "Main navigation"
```

### Step 5 — Check colour contrast

Using Chrome DevTools MCP or the Lighthouse a11y report, verify:

**Teal buttons on white background:**
- Teal: `#40B2A4`, White: `#FFFFFF`
- Contrast ratio: calculate as `(L1 + 0.05) / (L2 + 0.05)` where L is relative luminance
- WCAG AA requires ≥ 4.5:1 for normal text, ≥ 3:1 for large text/buttons
- If Lighthouse flags this, note the specific elements

**Navy text on white:**
- Navy on white should pass easily — confirm it's not failing

To check via DevTools:
1. `navigate_page` → `http://localhost:4321/`
2. Use Lighthouse a11y audit → look for "Color contrast" failures

### Step 6 — Check keyboard navigation (desktop)

1. `navigate_page` → `http://localhost:4321/`
2. `press_key` → Tab (repeatedly)
3. Verify focus moves through: skip-to-content link (if any) → logo → nav links → main content → footer
4. Check that focus indicator is visible (not hidden by `outline: none`)

```javascript
// Check if any element suppresses outline globally
const styleSheets = Array.from(document.styleSheets);
// Look for *:focus { outline: none } or similar
```

### Step 7 — Check tap targets on mobile

Emulate mobile viewport:
```
emulate({ device: "iPhone SE" })  // or resize_page 375×812
```

Navigate to home. Check that:
- Navigation links in the expanded hamburger menu have tap targets ≥ 48×48px
- "All News" and "All Events" buttons at the bottom of home are large enough
- Post card links cover enough of the card area

```javascript
// Check tap target sizes of nav links
Array.from(document.querySelectorAll('.nav-link'))
  .map(el => {
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim(), width: r.width, height: r.height };
  })
```

### Step 8 — Check skip navigation link

```javascript
// Does the page have a skip-to-content link?
document.querySelector('a[href="#main"], a[href="#content"], .skip-link')
```

If missing, note it — this is required for keyboard-only users to bypass the navigation.

### Step 9 — Check form labels (contact page)

```
navigate_page → http://localhost:4321/contact/
evaluate_script → Array.from(document.querySelectorAll('input,textarea,select'))
  .map(el => ({
    type: el.type,
    id: el.id,
    hasLabel: !!document.querySelector(`label[for="${el.id}"]`),
    ariaLabel: el.getAttribute('aria-label'),
  }))
```

Every form input must have either a `<label for="...">` or an `aria-label`.

### Step 10 — Check language of ZH post

```
navigate_page → http://localhost:4321/news/metashumagongminwangluoanquanxianggangluntan/
evaluate_script → document.documentElement.lang
```

Expected: `zh-Hant` (or `zh-hant`). This is a known issue from the migration — the `lang` attribute is likely wrong. Confirm and note.

## Issue severity key

- **BLOCK** (WCAG A) — fails legal/compliance requirements, must fix before go-live
- **WARN** (WCAG AA) — best practice, strongly recommended to fix
- **COSMETIC** — minor improvement, address in a future iteration

## Success criteria

Write `validation/reports/08-accessibility.md` with:

1. **Lighthouse a11y scores** per page (from Step 1)
2. **Issue table:**

| Issue | Pages affected | WCAG criterion | Severity | Recommended fix |
|-------|---------------|---------------|----------|-----------------|
| Missing skip-to-content | All | 2.4.1 | BLOCK | Add `<a href="#main" class="skip-link">Skip to content</a>` |
| Images missing alt | N pages | 1.1.1 | BLOCK | Add descriptive `alt` attributes |
| Wrong `<html lang>` | All | 3.1.1 | BLOCK | Derive lang from frontmatter |
| … | … | … | … | … |

3. **Colour contrast findings** — pass or fail with specific elements
4. **Keyboard navigation** — is focus visible throughout the page?
5. **Priority fix list** — ordered by severity

## Output file

`validation/reports/08-accessibility.md`

## If you get stuck

- If the `chrome-devtools-mcp:a11y-debugging` skill is available, invoke it at the top of the test for guided a11y checking.
- If `lighthouse_audit` can't run locally due to network restrictions: use `evaluate_script` with axe-core injected:
  ```javascript
  // Inject axe-core from CDN and run
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.0/axe.min.js';
  document.head.appendChild(script);
  // Then in a separate evaluate_script call after load:
  axe.run().then(r => JSON.stringify(r.violations.map(v => ({id:v.id, description:v.description, nodes:v.nodes.length}))))
  ```
- If `emulate` doesn't work: use `resize_page` with width=375 height=812 for mobile viewport.
