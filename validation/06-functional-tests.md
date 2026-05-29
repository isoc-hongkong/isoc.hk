# Test 06 — Functional Tests (Search, Forms, Donations)

**Effort:** ~15 min | **Prereqs:** Preview server running + Chrome DevTools MCP | **Tools:** chrome-devtools MCP, Bash, Read

## Goal

WordPress-backed forms and plugins are the most likely things to silently break in a migration — they look fine visually but do nothing when submitted. Test: Pagefind search, contact form, and all donation/membership pages.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Local preview: `http://localhost:4321` (run `npm run preview` — must use preview, NOT dev, so pagefind index is included)
- Search: Astro uses Pagefind (built by `npx pagefind --site dist` during `npm run build`). The search UI is at `/search/`.
- Forms found in: `src/content/pages/contact.md`, `src/content/pages/be-our-members.md`, `src/content/pages/full-memberships.md`
- Donation pages: `support-hong-kong-open-data-index-*.md` files in `src/content/pages/`

## Prerequisites

```bash
cd /Users/chpapa/Workspaces/isoc.hk/astro-site
npm run build    # builds dist/ AND runs pagefind
npm run preview &
# Wait ~5s for http://localhost:4321
```

## Section 1 — Pagefind Search

### Step 1.1 — Verify pagefind index was built

```bash
ls /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/pagefind/ 2>/dev/null \
  || echo "MISSING: pagefind index not found — run npm run build"
```

The `dist/pagefind/` directory should contain `pagefind.js`, `pagefind-entry.json`, and `pagefind-*.pf_index` files.

### Step 1.2 — Navigate to the search page

Using Chrome DevTools MCP:
1. `navigate_page` → `http://localhost:4321/search/`
2. `take_screenshot` — verify the search UI renders (input box visible)

### Step 1.3 — Test English search

1. `fill` or `type_text` the search input with `"ipv6"`
2. `press_key` Enter (or click the search button)
3. `wait_for` results to appear (selector: `.pagefind-ui__result` or similar)
4. `take_screenshot` — verify results are shown
5. Note: how many results? Are they relevant IPv6 posts?

### Step 1.4 — Test Chinese search

1. Clear the input, type `"香港"`
2. Press Enter / submit
3. `take_screenshot` — verify Chinese results appear
4. Note: do Chinese characters work in the search query?

### Step 1.5 — Test AGM search

1. Clear the input, type `"AGM"`
2. Submit and screenshot — should return notice posts

### Step 1.6 — Test no-results state

1. Search for `"zzznoresultsxxx"`
2. Verify a "no results" message appears (not a blank page or error)

### Step 1.7 — Check search page source for pagefind integration

```bash
grep -i "pagefind" /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/search/index.html | head -5
```

Verify pagefind CSS/JS is imported.

---

## Section 2 — Contact Form

### Step 2.1 — Inspect the contact page source

```bash
cat /Users/chpapa/Workspaces/isoc.hk/astro-site/src/content/pages/contact.md | head -60
```

Look for: `<form>` tags, `action=` attribute, `netlify` attribute (Netlify Forms), or references to a WP form plugin (Contact Form 7 shortcode `[contact-form-7 ...]`).

### Step 2.2 — Check the built HTML

```bash
grep -i "<form\|action=\|netlify\|formspree\|mailto:" \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/contact/index.html
```

**Expected findings:**
- If `<form netlify>` or `<form data-netlify="true">` → form is wired to Netlify Forms (works when deployed)
- If `action="https://formspree.io/..."` → third-party form handler (verify it's a live URL)
- If `action="/wp-admin/admin-ajax.php"` or Contact Form 7 shortcode remnant → **broken**
- If no `<form>` at all → contact form was not migrated

### Step 2.3 — Navigate to contact page in Chrome

1. `navigate_page` → `http://localhost:4321/contact/`
2. `take_screenshot`
3. Check: Is a form visible? Are the input fields labeled correctly?

### Step 2.4 — Attempt a test submission (if form exists)

Fill the form with test data:
- Name: "Test User"
- Email: "test@example.com"
- Message: "Migration validation test"

`fill_form` or `fill` each field, then click submit.

**Expected in preview:** If using Netlify Forms, the submission will fail in preview (no Netlify backend) — that's OK. Check the response: does it show an error gracefully, or does it throw a browser error?

---

## Section 3 — Membership / Donation Pages

### Step 3.1 — Inspect membership pages

```bash
for page in be-our-members full-memberships; do
  echo "=== $page ==="
  grep -i "<form\|action=\|button\|href.*stripe\|href.*paypal\|href.*pandaform\|href.*donate" \
    /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/$page/index.html | head -10
done
```

### Step 3.2 — Inspect donation pages

```bash
for page in $(ls /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/ | grep "support-hong-kong"); do
  echo "=== /$page/ ==="
  grep -i "form\|action=\|stripe\|paypal\|pandaform\|donate\|button" \
    /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/$page/index.html | head -5
done
```

For each, classify the payment integration:
- **Static link** to Stripe/PayPal/other → works as-is
- **Embedded form** with WP plugin (e.g., WooCommerce, GiveWP) → likely broken
- **No integration found** → donation path was not migrated

### Step 3.3 — Navigate to be-our-members in Chrome

1. `navigate_page` → `http://localhost:4321/be-our-members/`
2. `take_screenshot`
3. Inspect what interactive elements exist — buttons, links, forms

### Step 3.4 — Check payment success/failure pages

The site has `/payment-success/` and `/donation-payment-succeeded/` pages — these are post-payment landing pages. Verify they display correctly (they shouldn't have any active form elements):

```bash
grep -i "form\|script\|redirect" \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/payment-success/index.html | head -5
grep -i "form\|script\|redirect" \
  /Users/chpapa/Workspaces/isoc.hk/astro-site/dist/payment-failure/index.html | head -5
```

---

## Section 4 — Navigation & Internal Links

### Step 4.1 — Click through main navigation

From the home page, click each main nav item and verify the target page loads:
1. `navigate_page` → `http://localhost:4321/`
2. `click` "About" nav link → verify `/about/` loads
3. `click` browser back, then "News" → verify `/category/news/` loads
4. Repeat for Events, Join Us, Contact

### Step 4.2 — Mobile hamburger menu

1. `emulate` or `resize_page` to 375×812 (mobile)
2. `navigate_page` → `http://localhost:4321/`
3. `take_screenshot` — nav should be collapsed (hamburger visible)
4. `click` the hamburger button (selector: `#navToggle` or `button.nav-toggle`)
5. `take_screenshot` — menu should expand
6. `click` a menu item — verify navigation works

---

## Success criteria

Write `validation/reports/06-functional-tests.md` with:

1. **Search results:**

| Query | Results returned | Relevant? | Status |
|-------|-----------------|-----------|--------|
| "ipv6" | N | Yes/No | PASS/FAIL |
| "香港" | N | Yes/No | PASS/FAIL |
| "AGM" | N | Yes/No | PASS/FAIL |
| "zzznoresultsxxx" | 0 + graceful message | N/A | PASS/FAIL |

2. **Forms audit:**

| Page | Form present | Submit target | Integration | Status |
|------|-------------|--------------|-------------|--------|
| `/contact/` | Yes/No | `action="..."` | Netlify/Formspree/dead | PASS/FAIL |
| `/be-our-members/` | Yes/No | Link/Form | Stripe/PayPal/dead | PASS/FAIL |
| Donation pages | Yes/No | … | … | … |

3. **Navigation:** all main nav links working? Hamburger menu working on mobile?
4. **Remediation recommendations** per failing item

## Output file

`validation/reports/06-functional-tests.md`

## If you get stuck

- If the preview server is not at port 4321: check `npm run preview` output for the actual port.
- If Chrome MCP times out waiting for pagefind results: the pagefind index may not have been built — confirm `dist/pagefind/` exists.
- If a form action points to a third-party URL: note it but don't submit a real form request (avoid sending test data to live systems).
- If the content of a page renders blank: check the browser console with `get_console_message` for JS errors.
