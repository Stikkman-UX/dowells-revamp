# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Node.js/Express 4 + TypeScript (`strict`) backend for the Dowells site. Owns authentication, the page-generic CMS, asset storage (AWS S3), validation and all business rules. MongoDB via Mongoose 8, validation via zod 4.

The HTTP contract shared with the frontend lives in `../API_CONTRACT.md` — it is the source of truth. Change it first, then the code.

## Commands

```bash
npm run dev          # ts-node-dev --files (needed so src/types/*.d.ts augmentations load), auto-restart
npm run typecheck    # tsc --noEmit — meaningful: strict is on and @types/express is installed
npm run build        # tsc -> build/
npm start            # production: build/src/index.js with module-alias registered
npm run seed:admin   # idempotent upsert of the Admin user from ADMIN_SEED_* (re-hashes the password every run)
npm run seed:home -- [--content ./seed/content.json] [--assets-dir ./seed/assets] [--force]
npm run seed:products -- [--content ./seed/products.json] [--assets-dir ./seed/assets] [--force]   # sample categories/products; images fetched from dummyimage.com and uploaded through AssetService
```

There is no lint script and no test suite. There is no registration endpoint by design — admins only exist via `seed:admin`.

Requires MongoDB (`MONGODB_URL`) and AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`). Full key list: `.env.example`. The S3 bucket must allow public reads of `assets/*` (asset URLs are served directly).

## Agent Usage

Specialized agents live in `.claude/agents/`; the mandatory asset rules are in `.claude/skills/asset-management.md`.

## Layout and conventions

One folder per resource, always the same shape:

```
src/models/<r>/{interface,<r>}.ts
src/controllers/<r>/{validator,services,<r>Controller}.ts   (+ helper.ts for side effects)
src/routes/<r>Routes.ts                                     mounted under /api/v1 in src/routes/index.ts
```

- Controllers are thin and wrapped in `asyncErrorHandler`; services never touch `req`/`res`; only services throw (`OperationalError(status, message)` / `ValidationFailed`).
- Request validation: `validate(schema)` from `src/utils/helper/zod.ts`, mounted per route. It reports **every** zod issue as `errors: [{ path, message }]` with HTTP 422.
- Responses: success `{ message, data? }`; errors `{ status, statusCode, message, errors? }`. Stack traces only when `ENVIRONMENT=development`. Reuse `STATUS_CODES` / `MESSAGES` from `src/constants.ts`.
- Path aliases (`@utils`, `@models`, `@controllers`, `@routes`, `@config`, `@src`) must be declared in **both** `tsconfig.json#paths` and `package.json#_moduleAliases`.
- Logging: `logInfo` / `logError` (winston) and the morgan HTTP logger.

## Auth and request security

- Cookie sessions: `accessToken` (15 min) + `refreshToken` (7 d); `httpOnly`, `sameSite=lax`, `path=/`, `secure` only in production, no `Domain`. Cookie options have one source: `src/controllers/user/helper.ts`.
- Routes: `POST /auth/login|refresh|logout`, `GET /auth/me`. Google OAuth and forgot/reset-password code exists but is deliberately **not mounted**.
- `requireAuth` / `requireAdmin`: `src/utils/middleware/auth.ts`. Every `/admin/*` API uses both.
- CSRF (`src/utils/middleware/csrf.ts`): every non-GET needs an `Origin` whose host matches `FRONT_END_URL` **and** `X-Requested-With: XMLHttpRequest`, else 403.
- Rate limits (`src/utils/middleware/rateLimit.ts`): login is keyed by lowercased email (all traffic arrives from the Next server's IP) and counts **failed** attempts only.
- bcrypt cost is 12 (`src/utils/helper/bcrypt.ts`). It was once 19 (~37 s per login) — do not raise it without measuring.

## Asset management (mandatory — see `.claude/skills/asset-management.md`)

- Business data stores **only** `assetId` strings — never URLs, buckets or keys.
- `fileType` is `Image | Video | Document`. `Document` is `application/pdf` only, detected by the `%PDF-` magic bytes, and stored with `Content-Disposition: attachment; filename="<sanitised name>.pdf"` (`contentDispositionFor()` in `assetService.ts` is the only place that decides it). `replace()` keeps the same `fileType`, so a PDF can only be replaced by a PDF. Every resolved media carries `fileSize`.
- `AssetService` (`src/controllers/asset/assetService.ts`) is the **only** module allowed to import `src/utils/helper/s3Upload.ts`. `assetId = crypto.randomUUID()` is also the object key (`assets/<assetId>`).
- `replace()` overwrites in place (same id/key, same `fileType`) and bumps `updatedAt`; every URL is built in `toResponse()` and carries `?v=<updatedAt ms>`. Never build an asset URL anywhere else.
- `getMany()` resolves ids in one query — it is the read path for every page GET. There is **no asset library**: the HTTP surface is `POST` (upload) and `PUT` (replace in place) only. Nothing lists, fetches or deletes assets, and nothing ever deletes an S3 object — an asset that stops being referenced is simply left in place.
- Uploads (`src/utils/middleware/upload.ts`): multer memory storage, 50 MB, type decided by **magic bytes** (`fileSignature.ts`), never the client mimetype. SVG: ≤200 KB, strict UTF-8, `<svg` root, and no DOCTYPE/ENTITY, `<script>`, `<foreignObject>`, `on*=`, `javascript:` or external references. SVGs are stored with `Content-Disposition: attachment`; everything gets `Cache-Control: public, max-age=31536000, immutable`.

## CMS pages (page-generic)

Home is only the first page. **Nothing outside the registry and the seed may hardcode `home`.** Adding a page = add its section schemas + a registry entry; no new model, routes or controllers.

- `src/controllers/page/registry.ts`: `slug -> { title, kind: 'page' | 'global', path, sections: { key -> { schema, defaults() } } }`. Insertion order is render order. `_global` holds `header` + `footer`. Unknown slug/key -> 404, checked **before** any dotted Mongo path is built.
- `src/controllers/page/sections/*.schema.ts`: one zod schema per section, mirroring `API_CONTRACT.md` field for field; shared pieces (`mediaRef`, `href`, `button`, `highlightText`, limits) in `shared.schema.ts`. Media objects are non-strict so resolved extras (`url`, `mimeType`…) sent back by the admin are stripped, not rejected.
- One `Page` document per slug: `seo` + `sections: Map<key, { isVisible, data, rev, updatedAt }>`. (Older documents may still carry a stray `assetIds` array from the removed asset library; the strict schema ignores it and the next section save drops it.)
- Writes are atomic and revision-guarded — never `doc.save()`: upsert the doc, then `findOneAndUpdate({ slug, 'sections.<key>.rev': rev }, { $set: { 'sections.<key>': … rev + 1 } })`; no match -> 409. Use a plain `$set` (content may contain strings like `"$5,000"`; never an aggregation-pipeline update).
- Asset-aware validation on write is shared with the products module: `collectAssetIssues(parsed, assetMap, pathPrefix)` + `loadAssetMap(values)` in `mediaRefs.ts`. Rules: every `assetId` must exist, `icon` fields must be SVG, a field named `file` must be a Document and no other media field may be one, a video `media` needs an image `poster`, `ogImage` must be a raster image. Page sections report paths prefixed `data.`; products report body-relative paths.
- Public `GET /pages/:slug`: one page query + one `getMany`; hidden sections return only `{ isVisible: false }`; a stored section that fails its schema is omitted and logged, never a 500. Never-saved pages return `sections: {}` and the frontend renders its defaults.
- `_global` has a third section, `catalogue` (the site-wide product catalogue PDF, `file` must be a Document). It is rendered by product pages, not by the layout.
- `seed:home` reads `seed/content.json`, which is **generated** from the frontend's default content (`cd ../frontend && node scripts/export-seed-content.mjs ../backend/seed/content.json`) — do not hand-edit copy there. It uploads referenced files through `AssetService`, de-duplicates per run, only seeds never-saved sections unless `--force`, and doubles as a contract test between the frontend types and these schemas.

## Products (entity module — see API_CONTRACT.md §6 and the root CLAUDE.md "Products Module")

Categories and Products are the first real resource models beyond page/asset/user. They follow the standard three-file shape:

```
src/models/category/{interface,category}.ts     src/controllers/category/{validator,services,categoryController}.ts   src/routes/categoryRoutes.ts
src/models/product/{interface,product}.ts       src/controllers/product/{schema,validator,services,productController}.ts src/routes/productRoutes.ts
```

- `Product.hero/downloads/specs/deployed/safety` are `Schema.Types.Mixed`; their shape is owned by the zod schema in `controllers/product/schema.ts` (built from `page/sections/shared.schema.ts` pieces + `slugSchema`), exactly like a page section's `data`. `productDefaults(categoryId)` carries the Figma headings and button copy.
- Every write: zod `safeParse` (422, body-relative paths, **no `data.` prefix**) → `loadAssetMap` → `collectAssetIssues(parsed, map, "")` (422) → `findOneAndUpdate({ _id, rev }, { $set, $inc: { rev: 1 } })`; existence is checked first so unknown → 404 and no match → 409. Plain `$set` only, never `doc.save()`.
- Slugs: `^[a-z0-9]+(?:-[a-z0-9]+)*$`, ≤ 80, editable. Category slug unique globally (`{ slug }` index); product slug unique per category (`{ categoryId, slug }`). Pre-check → 409 `slugConflict`, and the E11000 race is mapped to 409 too.
- Ordering: `order` is 0-based per list; create appends; `reorder` requires the complete id set (else 422 `reorderIdsMismatch`) and writes with one `bulkWrite`. Reorder does not bump `rev`; the publish toggle does.
- Deleting a category with products (any publish state) → 409 `categoryHasProducts`. Deleting never touches assets or S3.
- Public reads: `GET /products/categories` = categories (≤ 50) + published products (≤ 200 each) grouped, empty categories dropped. `GET /products/:categorySlug/:productSlug` = one product + `similar` (same category, published, not self, projected to `name, slug, subtitle, hero.image`) resolved with **one** `loadAssetMap` call.
- Route order: `GET /products/categories` before `/products/:categorySlug/:productSlug`; every `PUT /reorder` before `/:id`. Admin routers use `requireAuth, requireAdmin` at router level; `:id` params are validated as 24-hex ObjectIds (422 otherwise).
- `seed:products` reads `seed/products.json` (hand-written sample content, unlike `content.json`), fetches raster placeholders from dummyimage.com, uploads them and the SVG icons / fixture PDF through `AssetService` (shared helpers in `src/seed/lib/seedMedia.ts`, also used by `seed:home`), and writes through the category/product services so validation is identical to HTTP. Idempotent by slug; `--force` rewrites.
