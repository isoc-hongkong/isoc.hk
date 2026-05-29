# Migration Validation Suite

WordPress → Astro migration validation for isoc.hk. Each test is a self-contained handoff doc — a fresh Claude session can pick any one up cold and execute it without prior context.

## How to run a test

```
# In Claude Code, open a new session in this repo and paste:
claude "Execute the validation playbook at validation/NN-<name>.md. Write the report to validation/reports/NN-<name>.md."
```

Or just open the doc and follow the steps manually / let Claude drive via MCP.

## Status tracker

Update this as tests complete.

- [ ] 00 Content Fidelity Scan — `validation/reports/00-content-fidelity.md`
- [ ] 01 Internal Link & Image Integrity — `validation/reports/01-link-and-image-integrity.md`
- [ ] 02 `<head>` Metadata + HTML Lang Audit — `validation/reports/02-head-metadata-audit.md`
- [ ] 03 Live WP Sitemap vs Astro URL Coverage — `validation/reports/03-url-coverage.md`
- [ ] 04 Redirect Behavior Verification — `validation/reports/04-redirect-behavior.md`
- [ ] 05 Visual Regression (desktop / tablet / mobile) — `validation/reports/05-visual-regression.md`
- [ ] 06 Functional Tests (search, forms, donations) — `validation/reports/06-functional-tests.md`
- [ ] 07 Lighthouse Performance Baseline — `validation/reports/07-lighthouse.md`
- [ ] 08 Accessibility Audit — `validation/reports/08-accessibility.md`

## Run order and rationale

Tests are numbered by value — run 00 first. Tests 00–04 cover 80% of one-pass-migration failure modes and need no browser. Tests 05–08 need Chrome DevTools MCP.

| # | Test | Prereqs | Effort |
|---|------|---------|--------|
| 00 | Content Fidelity Scan | None | ~2 min |
| 01 | Internal Link & Image Integrity | `dist/` built | ~5 min |
| 02 | `<head>` Metadata + HTML Lang | `dist/` built | ~5 min |
| 03 | WP Sitemap vs Astro URL Coverage | Live site up + `dist/` built | ~10 min |
| 04 | Redirect Behavior Verification | `netlify-cli` or Netlify preview URL | ~10 min |
| 05 | Visual Regression | Dev/preview server + Chrome MCP | ~20 min |
| 06 | Functional Tests | Preview server + Chrome MCP | ~15 min |
| 07 | Lighthouse | Preview server + Chrome MCP | ~10 min |
| 08 | Accessibility | Preview server + Chrome MCP | ~15 min |

## Shared prerequisites

**For all tests:**
```bash
cd /Users/chpapa/Workspaces/isoc.hk/astro-site
npm install   # if node_modules missing
```

**For tests 01–03:** `dist/` must exist. If not:
```bash
npm run build   # builds + runs pagefind
```

**For test 04:** `netlify-cli` must be installed:
```bash
npm install -g netlify-cli   # or: npx netlify-cli
```
Or use a deployed Netlify Preview URL if one is available.

**For tests 05–08:** 
- `npm run preview` must be running (serves the built `dist/` at http://localhost:4321)
- Chrome DevTools MCP must be connected in the Claude session

## Known issues found during initial migration review

These are confirmed bugs — the tests will document them, but they're real:

1. **`<html lang="zh-Hant">` on English home page** — home page template hardcodes the wrong lang attribute.
2. **Double-escaped HTML entities in excerpts** — post card excerpts display `&amp;#8216;` instead of the correct `'`. Visible on home page and news index.

Both need fixes in the Astro templates/content pipeline regardless of the rest of the audit.

## Reports directory

All reports land in `validation/reports/`. Each report file is a markdown document with:
- Test date and executor
- Summary (pass / warn / fail)
- Issue table or findings list
- Recommended remediation per issue

After the full suite runs, do a final pass in `validation/reports/` and prioritise issues for a fix PR.
