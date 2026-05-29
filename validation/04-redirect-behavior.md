# Test 04 — Redirect Behavior Verification

**Effort:** ~10 min | **Prereqs:** `netlify-cli` OR a deployed Netlify preview URL | **Tools:** Bash (curl)

## Goal

Verify that the redirect rules in `netlify.toml` actually behave as written when Netlify processes them. The file is large (1985 lines, auto-generated) and Netlify's query-parameter matching has known edge cases where `?p=N` rules can silently fail.

## Context

- Repo: `/Users/chpapa/Workspaces/isoc.hk/astro-site`
- Redirects file: `netlify.toml`
- Rule types to test:
  1. `?p=N` shortlink rules (most numerous, highest risk — WP legacy shortlinks)
  2. `/wp-admin/*`, `/wp-login.php`, `/xmlrpc.php`, `/wp-json/*` → 410 Gone
  3. `/author/*`, `/20:year/`, `/20:year/:month/`, `/20:year/:month/:day/` → 301 to `/category/news/`
  4. `/?s=:query` → 301 to `/search/?q=:query`
  5. `/comments/feed/` → 301 to `/feed/`

## Prerequisites

### Option A — Local `netlify dev`

```bash
# Install netlify-cli if not available
npx netlify-cli --version || npm install -g netlify-cli

# In the repo directory, start netlify dev (will build if needed)
cd /Users/chpapa/Workspaces/isoc.hk/astro-site
npx netlify-cli dev --port 8888 &
# Wait ~15s for it to start, then test at http://localhost:8888
```

Use `BASE_URL="http://localhost:8888"` in all curl commands below.

### Option B — Deployed Netlify Preview

If a preview deploy exists, set `BASE_URL` to the preview URL:
```bash
BASE_URL="https://XXXXXXX--isoc-hk.netlify.app"
```

**Note:** Test 04 CANNOT be run against `npm run preview` (the Astro preview server does not read `netlify.toml` redirects). Must use `netlify dev` or a real Netlify deployment.

## Steps

### Step 1 — Warm-up: verify server is responding

```bash
curl -sI "$BASE_URL/" | head -5
```
Expected: `HTTP/1.1 200 OK` (or 200 with HTML).

### Step 2 — Test `?p=N` shortlink redirects (10 samples)

Sample 10 `?p=N` redirects from `netlify.toml`. For each, verify:
- HTTP 301 response
- `Location` header points to the correct new path

```bash
BASE_URL="http://localhost:8888"   # or your preview URL

test_redirect() {
  FROM_URL="$1"
  EXPECTED_TO="$2"
  RESULT=$(curl -sI --max-time 10 "$BASE_URL$FROM_URL" | grep -E "^HTTP|^Location|^location")
  HTTP_CODE=$(echo "$RESULT" | grep "^HTTP" | awk '{print $2}')
  LOCATION=$(echo "$RESULT" | grep -i "^location" | sed 's/[Ll]ocation: //' | tr -d '\r')
  if [ "$HTTP_CODE" = "301" ] && echo "$LOCATION" | grep -q "$EXPECTED_TO"; then
    echo "PASS: $FROM_URL → $LOCATION"
  else
    echo "FAIL: $FROM_URL | HTTP=$HTTP_CODE | Location=$LOCATION | Expected: $EXPECTED_TO"
  fi
}

# Test 10 ?p=N shortlinks
test_redirect "/?p=211"  "/news/211/"
test_redirect "/?p=6172" "/news/10th-anniversary-celebration-cum-asia-internet-symposium-hong-kong-11-nov-cyberport-hk/"
test_redirect "/?p=404"  "/news/best-wishes-for-the-year-of-the-dragon-from-internet-society-hong-kong/"
test_redirect "/?p=7372" "/news/hong-kong-internet-governance-forum-xiangganghulianwangzhililuntan-2025/"
test_redirect "/?p=7380" "/news/wangluoanquantongxing-x-rengongzhineng-tiyanri/"
test_redirect "/?p=7359" "/news/board-of-directors-2024-25/"
test_redirect "/?p=113"  "/news/"        # This p= may not exist — expect 404 or redirect to /
test_redirect "/?p=46"   "/news/internet-hall-of-fame-issues-call-for-nomination/"
test_redirect "/?p=291"  "/news/building-trust-in-cloud-computing-summit-2012/"
test_redirect "/?p=6792" "/news/3rd-hkigf/"
```

### Step 3 — Test WP admin blocks (expect 410)

```bash
test_410() {
  FROM_URL="$1"
  HTTP_CODE=$(curl -sI --max-time 10 "$BASE_URL$FROM_URL" | grep "^HTTP" | awk '{print $2}')
  if [ "$HTTP_CODE" = "410" ]; then
    echo "PASS 410: $FROM_URL"
  else
    echo "FAIL: $FROM_URL returned $HTTP_CODE (expected 410)"
  fi
}

test_410 "/wp-admin/"
test_410 "/wp-admin/admin.php"
test_410 "/wp-login.php"
test_410 "/xmlrpc.php"
test_410 "/wp-json/"
test_410 "/wp-json/wp/v2/posts"
```

### Step 4 — Test author and date archive redirects (expect 301 → `/category/news/`)

```bash
test_redirect "/author/chester/"         "/category/news/"
test_redirect "/2015/"                   "/category/news/"
test_redirect "/2015/03/"               "/category/news/"
test_redirect "/2015/03/15/"            "/category/news/"
```

### Step 5 — Test search redirect

```bash
# /?s=ipv6 should redirect to /search/?q=ipv6
RESULT=$(curl -sI --max-time 10 "$BASE_URL/?s=ipv6" | grep -i "^location" | sed 's/[Ll]ocation: //' | tr -d '\r')
echo "Search redirect: $RESULT"
# Expected: http://localhost:8888/search/?q=ipv6 (or equivalent)
```

### Step 6 — Test comments feed redirect

```bash
test_redirect "/comments/feed/" "/feed/"
```

### Step 7 — Verify non-existent page returns 404

```bash
HTTP_CODE=$(curl -sI --max-time 10 "$BASE_URL/this-page-does-not-exist-xyz/" | grep "^HTTP" | awk '{print $2}')
echo "Non-existent page: HTTP $HTTP_CODE (expected 404)"
```

### Step 8 — Known Netlify query-matching footgun check

Netlify's `query` matching requires an exact match of the query parameter name and value. Test edge cases:

```bash
# ?P=211 (uppercase P) — should NOT redirect (case-sensitive)
HTTP_CODE=$(curl -sI --max-time 10 "$BASE_URL/?P=211" | grep "^HTTP" | awk '{print $2}')
echo "?P=211 (uppercase): HTTP $HTTP_CODE (expect NOT 301, probably 200 or 404)"

# ?p=211&extra=param — additional params may break the query rule
HTTP_CODE=$(curl -sI --max-time 10 "$BASE_URL/?p=211&utm_source=test" | grep "^HTTP" | awk '{print $2}')
echo "?p=211&extra=param: HTTP $HTTP_CODE (Netlify may or may not redirect)"
```

Note the behavior for the report — if `?p=211&utm_source=...` doesn't redirect, that's a real-world issue since many WP shortlinks get shared with tracking parameters appended.

## Success criteria

Write `validation/reports/04-redirect-behavior.md` with:

1. **Summary** — total tested, pass, fail
2. **Results table:**

| From URL | Expected code | Expected location | Actual code | Actual location | Status |
|----------|--------------|-------------------|-------------|-----------------|--------|
| `/?p=211` | 301 | `/news/211/` | 301 | `/news/211/` | PASS |
| … | … | … | … | … | … |

3. **Footgun findings** — does `?p=N&extra=param` work? Does uppercase `?P=N` redirect?
4. **Any failures** with root cause (e.g., rule ordering in `netlify.toml`, Netlify query matching limitation)

## Output file

`validation/reports/04-redirect-behavior.md`

## If you get stuck

- If `netlify dev` fails to start, check that the `dist/` is built (`npm run build` first). `netlify dev` may attempt to build itself.
- If `netlify dev` is not available and no preview URL exists: note in the report that this test requires a Netlify environment and proceed to test 05.
- Netlify query-redirect rules are documented at: https://docs.netlify.com/routing/redirects/redirect-options/#query-parameters
- If curl reports "Connection refused", wait 15 more seconds for `netlify dev` to finish starting.
