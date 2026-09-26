#!/usr/bin/env bash
# Smoke test for the Products module (Categories + Products, API_CONTRACT §6).
# Runs the acceptance sequence from the approved plan against a running
# backend (`npm run dev`, default port 8000). Prints PASS/FAIL per step and
# exits non-zero if any step fails.
#
# Usage: BASE_URL=http://localhost:8000 ./scripts/smoke-products.sh
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"

BASE_URL="${BASE_URL:-http://localhost:8000}"

env_value() {
  # Reads KEY=value out of backend/.env without sourcing it (values may not
  # be shell-safe). Strips surrounding quotes if present.
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-)"
  line="${line%\"}"
  line="${line#\"}"
  printf '%s' "$line"
}

if [ ! -f "$ENV_FILE" ]; then
  echo "FAIL: backend/.env not found at $ENV_FILE"
  exit 1
fi

ADMIN_SEED_EMAIL="${ADMIN_SEED_EMAIL:-$(env_value ADMIN_SEED_EMAIL)}"
ADMIN_SEED_PASSWORD="${ADMIN_SEED_PASSWORD:-$(env_value ADMIN_SEED_PASSWORD)}"
FRONT_END_URL="${FRONT_END_URL:-$(env_value FRONT_END_URL)}"

if [ -z "$ADMIN_SEED_EMAIL" ] || [ -z "$ADMIN_SEED_PASSWORD" ] || [ -z "$FRONT_END_URL" ]; then
  echo "FAIL: ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD / FRONT_END_URL could not be read from backend/.env"
  exit 1
fi

TMPDIR="${TMPDIR:-/tmp}"
mkdir -p "$TMPDIR"
RUN_ID="smoke-products-$$-$(date +%s)"
WORKDIR="$TMPDIR/$RUN_ID"
mkdir -p "$WORKDIR"
COOKIE_JAR="$WORKDIR/cookies.txt"

TS="$(date +%s)"
CATEGORY_SLUG="smoke-cat-$TS"
PRODUCT_SLUG="smoke-prod-$TS"

PNG_PATH="$BACKEND_DIR/../frontend/public/home/about/polycab-logo.png"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "PASS: $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "FAIL: $1"
}

fail_fatal() {
  fail "$1"
  echo "Aborting — later steps depend on this one."
  summary
  exit 1
}

summary() {
  echo "----------------------------------------"
  echo "Passed: $PASS_COUNT  Failed: $FAIL_COUNT"
}

# Reads a dotted JSON path (e.g. "data.category._id") out of a file. Prints
# "" (and nothing else) when the path is missing so callers can test -z.
json_get() {
  local file="$1"
  local path="$2"
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const path = process.argv[2];
    let value;
    try {
      value = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      process.stdout.write("");
      process.exit(0);
    }
    for (const key of path.split(".")) {
      if (value === null || value === undefined) { value = undefined; break; }
      value = value[key];
    }
    if (value === undefined) process.stdout.write("");
    else if (typeof value === "string") process.stdout.write(value);
    else process.stdout.write(JSON.stringify(value));
  ' "$file" "$path"
}

# True (exit 0) when `needle` appears as some issue's `path` in a
# ValidationFailed response's `errors[]` array.
json_errors_has_path() {
  local file="$1"
  local needle="$2"
  node -e '
    const fs = require("fs");
    const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const needle = process.argv[2];
    const errors = Array.isArray(body.errors) ? body.errors : [];
    process.exit(errors.some((e) => e && e.path === needle) ? 0 : 1);
  ' "$file" "$needle"
}

# ---- 0. login ---------------------------------------------------------------

LOGIN_BODY="$WORKDIR/login-body.json"
node -e '
  const fs = require("fs");
  fs.writeFileSync(process.argv[3], JSON.stringify({ email: process.argv[1], password: process.argv[2] }));
' "$ADMIN_SEED_EMAIL" "$ADMIN_SEED_PASSWORD" "$LOGIN_BODY"

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  --data-binary @"$LOGIN_BODY" \
  -o "$WORKDIR/login.json" -w '%{http_code}')

if [ "$STATUS" = "200" ]; then pass "login (200)"; else fail_fatal "login expected 200, got $STATUS ($(cat "$WORKDIR/login.json"))"; fi

# ---- 1. POST category (201) --------------------------------------------------

CATEGORY_CREATE_BODY="$WORKDIR/category-create.json"
node -e '
  const fs = require("fs");
  const [slug, outFile] = process.argv.slice(1);
  fs.writeFileSync(outFile, JSON.stringify({
    name: "Smoke Category",
    slug,
    description: "Category created by scripts/smoke-products.sh",
  }));
' "$CATEGORY_SLUG" "$CATEGORY_CREATE_BODY"

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/admin/categories" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  --data-binary @"$CATEGORY_CREATE_BODY" \
  -o "$WORKDIR/category-create-resp.json" -w '%{http_code}')

if [ "$STATUS" = "201" ]; then pass "POST category (201)"; else fail_fatal "POST category expected 201, got $STATUS ($(cat "$WORKDIR/category-create-resp.json"))"; fi

CATEGORY_ID="$(json_get "$WORKDIR/category-create-resp.json" data.category._id)"
if [ -z "$CATEGORY_ID" ]; then fail_fatal "could not read category._id from create response"; fi

# ---- 2. POST same slug (409) -------------------------------------------------

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/admin/categories" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  --data-binary @"$CATEGORY_CREATE_BODY" \
  -o "$WORKDIR/category-dup.json" -w '%{http_code}')

if [ "$STATUS" = "409" ]; then pass "POST duplicate category slug (409)"; else fail "POST duplicate category slug expected 409, got $STATUS ($(cat "$WORKDIR/category-dup.json"))"; fi

# ---- 3. POST product (draft) (201) -------------------------------------------

PRODUCT_CREATE_BODY="$WORKDIR/product-create.json"
node -e '
  const fs = require("fs");
  const [categoryId, slug, out] = process.argv.slice(1);
  const defaultButton = (text) => ({
    text, href: "", withIcon: false, icon: null, iconPosition: "left", openInNewTab: false,
  });
  const product = {
    categoryId,
    name: "Smoke Product",
    slug,
    subtitle: "Heavy Duty",
    isPublished: false,
    seo: { title: "", description: "", canonical: "", noindex: false, ogImage: null },
    hero: {
      image: null,
      description: "Smoke test hero description.",
      keySpecs: [],
      idealFor: [],
      primaryButton: defaultButton("Find Dealer"),
      secondaryButton: defaultButton("Contact Sales"),
    },
    downloads: {
      heading: "Everything your engineers need.",
      items: [{ title: "Datasheet", file: null }],
    },
    specs: { heading: "Built to perform.", items: [] },
    deployed: { heading: "Where this product is deployed.", items: [] },
    safety: { heading: "Engineered for safety and longevity.", bullets: [], image: null, certifications: [] },
  };
  fs.writeFileSync(out, JSON.stringify(product));
' "$CATEGORY_ID" "$PRODUCT_SLUG" "$PRODUCT_CREATE_BODY"

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/admin/products" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  --data-binary @"$PRODUCT_CREATE_BODY" \
  -o "$WORKDIR/product-create-resp.json" -w '%{http_code}')

if [ "$STATUS" = "201" ]; then pass "POST product draft (201)"; else fail_fatal "POST product expected 201, got $STATUS ($(cat "$WORKDIR/product-create-resp.json"))"; fi

PRODUCT_ID="$(json_get "$WORKDIR/product-create-resp.json" data.product._id)"
PRODUCT_REV="$(json_get "$WORKDIR/product-create-resp.json" data.product.rev)"
if [ -z "$PRODUCT_ID" ]; then fail_fatal "could not read product._id from create response"; fi

# ---- 4. GET /products/categories — draft product's category absent ---------

STATUS=$(curl -sS "$BASE_URL/api/v1/products/categories" -o "$WORKDIR/public-categories-1.json" -w '%{http_code}')
if [ "$STATUS" = "200" ]; then
  MATCH="$(json_get "$WORKDIR/public-categories-1.json" data.categories)"
  if node -e '
      const categories = JSON.parse(process.argv[2]);
      process.exit(categories.some((c) => c.slug === process.argv[1]) ? 1 : 0);
    ' "$CATEGORY_SLUG" "$MATCH" 2>/dev/null; then
    pass "GET /products/categories excludes category with 0 published products"
  else
    fail "GET /products/categories unexpectedly lists $CATEGORY_SLUG before publish"
  fi
else
  fail "GET /products/categories expected 200, got $STATUS"
fi

# ---- 5. PUT publish (200) ----------------------------------------------------

PUBLISH_BODY="$WORKDIR/publish-true.json"
node -e 'require("fs").writeFileSync(process.argv[2], JSON.stringify({ isPublished: true, rev: Number(process.argv[1]) }));' \
  "$PRODUCT_REV" "$PUBLISH_BODY"

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/v1/admin/products/$PRODUCT_ID/publish" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  --data-binary @"$PUBLISH_BODY" \
  -o "$WORKDIR/publish-resp.json" -w '%{http_code}')

if [ "$STATUS" = "200" ]; then pass "PUT publish (200)"; else fail "PUT publish expected 200, got $STATUS ($(cat "$WORKDIR/publish-resp.json"))"; fi

PUBLISHED_REV="$(json_get "$WORKDIR/publish-resp.json" data.product.rev)"

# ---- 6. GET /products/categories — now lists it with 1 product -------------

STATUS=$(curl -sS "$BASE_URL/api/v1/products/categories" -o "$WORKDIR/public-categories-2.json" -w '%{http_code}')
if [ "$STATUS" = "200" ]; then
  if node -e '
      const fs = require("fs");
      const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const category = (body.data.categories || []).find((c) => c.slug === process.argv[2]);
      if (!category) process.exit(1);
      process.exit(category.products.length === 1 && category.products[0].slug === process.argv[3] ? 0 : 1);
    ' "$WORKDIR/public-categories-2.json" "$CATEGORY_SLUG" "$PRODUCT_SLUG"; then
    pass "GET /products/categories lists category with 1 published product"
  else
    fail "GET /products/categories does not list $CATEGORY_SLUG with exactly 1 product ($(cat "$WORKDIR/public-categories-2.json"))"
  fi
else
  fail "GET /products/categories expected 200, got $STATUS"
fi

# ---- 7. GET /products/:c/:p — 200, similar: [] ------------------------------

STATUS=$(curl -sS "$BASE_URL/api/v1/products/$CATEGORY_SLUG/$PRODUCT_SLUG" -o "$WORKDIR/public-product.json" -w '%{http_code}')
if [ "$STATUS" = "200" ]; then
  SIMILAR="$(json_get "$WORKDIR/public-product.json" data.similar)"
  if [ "$SIMILAR" = "[]" ]; then
    pass "GET /products/$CATEGORY_SLUG/$PRODUCT_SLUG (200, similar: [])"
  else
    fail "GET /products/$CATEGORY_SLUG/$PRODUCT_SLUG expected similar: [], got $SIMILAR"
  fi
else
  fail "GET /products/$CATEGORY_SLUG/$PRODUCT_SLUG expected 200, got $STATUS"
fi

# ---- 8. GET /products/:c/nope — 404 ------------------------------------------

STATUS=$(curl -sS "$BASE_URL/api/v1/products/$CATEGORY_SLUG/nope-$TS" -o "$WORKDIR/public-product-404.json" -w '%{http_code}')
if [ "$STATUS" = "404" ]; then pass "GET /products/$CATEGORY_SLUG/nope-$TS (404)"; else fail "expected 404, got $STATUS"; fi

# ---- 9. PUT product with stale rev — 409 ------------------------------------

STALE_BODY="$WORKDIR/product-stale.json"
node -e '
  const fs = require("fs");
  const [inFile, staleRev, outFile] = process.argv.slice(1);
  const product = JSON.parse(fs.readFileSync(inFile, "utf8"));
  product.rev = Number(staleRev);
  fs.writeFileSync(outFile, JSON.stringify(product));
' "$PRODUCT_CREATE_BODY" "$PRODUCT_REV" "$STALE_BODY"

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/v1/admin/products/$PRODUCT_ID" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  --data-binary @"$STALE_BODY" \
  -o "$WORKDIR/product-stale-resp.json" -w '%{http_code}')

if [ "$STATUS" = "409" ]; then pass "PUT product with stale rev (409)"; else fail "PUT product with stale rev expected 409, got $STATUS ($(cat "$WORKDIR/product-stale-resp.json"))"; fi

# ---- 10. PUT product with a PNG in downloads.items[0].file — 422 -----------

if [ ! -f "$PNG_PATH" ]; then
  fail "fixture PNG not found at $PNG_PATH — skipping downloads.items.0.file 422 check"
else
  STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/admin/assets" \
    -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" \
    -F "file=@$PNG_PATH" \
    -o "$WORKDIR/asset-upload.json" -w '%{http_code}')

  if [ "$STATUS" = "201" ]; then pass "POST /admin/assets PNG upload (201)"; else fail_fatal "POST /admin/assets expected 201, got $STATUS ($(cat "$WORKDIR/asset-upload.json"))"; fi

  PNG_ASSET_ID="$(json_get "$WORKDIR/asset-upload.json" data.asset.assetId)"
  if [ -z "$PNG_ASSET_ID" ]; then fail_fatal "could not read asset.assetId from upload response"; fi

  # Fetch the current admin product so we send a fresh rev and valid content
  # for every other field (only downloads.items[0].file gets broken).
  STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE_URL/api/v1/admin/products/$PRODUCT_ID" \
    -o "$WORKDIR/product-current.json" -w '%{http_code}')
  if [ "$STATUS" != "200" ]; then fail_fatal "GET /admin/products/:id expected 200, got $STATUS"; fi

  BAD_FILE_BODY="$WORKDIR/product-bad-file.json"
  node -e '
    const fs = require("fs");
    const [inFile, assetId, outFile] = process.argv.slice(1);
    const body = JSON.parse(fs.readFileSync(inFile, "utf8"));
    const product = body.data.product;
    // Strip response-only fields — the PUT body is ProductInput & { rev }.
    delete product._id;
    delete product.order;
    delete product.createdAt;
    delete product.updatedAt;
    product.downloads.items[0] = { title: "Datasheet", file: { assetId, alt: "" } };
    fs.writeFileSync(outFile, JSON.stringify(product));
  ' "$WORKDIR/product-current.json" "$PNG_ASSET_ID" "$BAD_FILE_BODY"

  STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/v1/admin/products/$PRODUCT_ID" \
    -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
    --data-binary @"$BAD_FILE_BODY" \
    -o "$WORKDIR/product-bad-file-resp.json" -w '%{http_code}')

  if [ "$STATUS" = "422" ]; then
    if json_errors_has_path "$WORKDIR/product-bad-file-resp.json" "downloads.items.0.file"; then
      pass "PUT product with PNG in downloads.items.0.file (422 at downloads.items.0.file)"
    else
      fail "PUT product with PNG in downloads.items.0.file was 422 but errors[] did not contain path downloads.items.0.file ($(cat "$WORKDIR/product-bad-file-resp.json"))"
    fi
  else
    fail "PUT product with PNG in downloads.items.0.file expected 422, got $STATUS ($(cat "$WORKDIR/product-bad-file-resp.json"))"
  fi
fi

# ---- 11. DELETE category while it still has a product — 409 ----------------

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/v1/admin/categories/$CATEGORY_ID" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  -o "$WORKDIR/category-delete-409.json" -w '%{http_code}')

if [ "$STATUS" = "409" ]; then pass "DELETE category with products (409)"; else fail "DELETE category with products expected 409, got $STATUS ($(cat "$WORKDIR/category-delete-409.json"))"; fi

# ---- 12. DELETE product — 200 ------------------------------------------------

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/v1/admin/products/$PRODUCT_ID" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  -o "$WORKDIR/product-delete.json" -w '%{http_code}')

if [ "$STATUS" = "200" ]; then pass "DELETE product (200)"; else fail "DELETE product expected 200, got $STATUS ($(cat "$WORKDIR/product-delete.json"))"; fi

# ---- 13. DELETE category — 200 -----------------------------------------------

STATUS=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/v1/admin/categories/$CATEGORY_ID" \
  -H "Origin: $FRONT_END_URL" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
  -o "$WORKDIR/category-delete-200.json" -w '%{http_code}')

if [ "$STATUS" = "200" ]; then pass "DELETE category (200)"; else fail "DELETE category expected 200, got $STATUS ($(cat "$WORKDIR/category-delete-200.json"))"; fi

summary

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
