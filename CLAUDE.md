# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Compooper** — a public-bathroom finder that ranks bathrooms by whether they are worth
_sitting in_, then points a compass dial at the winner. MapLibre map, OSM-sourced toilet
data, community ratings and condition reports.

It is the sister app to [**Compisser**](https://github.com/tajmahal226/compisser), and the
split between them is the whole product thesis:

|               | Compisser                    | Compooper                                |
| ------------- | ---------------------------- | ---------------------------------------- |
| Use case      | Pee — urgent                 | Poop — you need a proper sit             |
| Optimizes for | **Proximity.** Nearest wins. | **Cleanliness.** Upscale-and-clean wins. |
| Default sort  | `distance`                   | `nicest` (`brand.defaultSort`)           |

The thing most likely to be "fixed" wrongly: **free and near is not the goal.** A public
library is free, pleasant and probably closer — and is explicitly excluded from the upscale
tier, because this app exists to find somewhere you would happily spend ten minutes. Cost is a
footnote, distance is a tie-break. See `src/lib/throne.ts`.

This repo is a **fork of Compisser**, which is itself a Grok "app builder" workspace
template. `scripts/`, `server/`, and `migrations/` are byte-identical to the sister repo, as
are `tsconfig.json`, `eslint.config.mjs`, and `.prettierrc` — keep them that way, and port
platform fixes across rather than diverging. Compooper's own additions are `src/lib/brand.tsx`,
`src/lib/throne.ts`, `src/routes/compooper/*`, and the warm palette.

Unlike Compisser, this repo has **no `AGENTS.md`** (though `vite.config.ts` still references
one) and no `.grok/skills/`. Its hard rules about not deleting platform files still apply —
see "Platform files you must not remove".

## Commands

```bash
npm ci                # node_modules is NOT committed; install before anything else
npm run dev           # vite dev on 0.0.0.0:8080 (strictPort — the preview contract)
npm run build         # vite build (nitro vercel preset) + npm run db:migrate
npm run typecheck     # tsc --noEmit  (src + server)
npm run lint          # eslint .
npm test              # node --test 'scripts/**/*.test.mjs'
npm run format        # prettier --write .
```

Run a single test file / single test:

```bash
node --test scripts/brand-check.test.mjs
node --test --test-name-pattern "vite config keeps the nitro serverDir wiring" scripts/*.test.mjs
```

There is **no test runner for `src/`** — the only tests are Node's built-in runner over the
platform guard scripts in `scripts/`. App logic is verified by loading the dev server
(`curl http://127.0.0.1:8080/`) and by Playwright screenshots. `npm run build` does not run
`typecheck` — run both.

### Visual QA

```bash
node scripts/browser-smoke.mjs http://127.0.0.1:8080/ <out.png>
```

`scripts/browser-guard.mjs` restricts this hard: **http/https loopback hosts only** (override
`BROWSER_ALLOW_EXTERNAL_HOST=1`) and the **output PNG must resolve under `/workspace`**.
Outside a Grok sandbox that path may not exist — create it, or drive Playwright directly.

## Architecture

### Framework wiring

TanStack Start (React 19 + Vite 8) with file-based routing. `src/router.tsx` exports a **named
`getRouter`** (not a default `createRouter` export — the installed Start plugin rejects that)
and must pass `defaultErrorComponent: AppErrorComponent`. `src/routeTree.gen.ts` is generated
and committed; it is ESLint-ignored — never hand-edit it.

Routes: `/` (landing), `/map` (the actual app), `/about`, `/help`, `/download`, `/login`,
`/privacy`, `/api/auth/$` (Better Auth catch-all). `src/routes/compooper/*` are legacy redirect
stubs that bounce to the top-level equivalents — put real UI in the top-level routes.

`vite.config.ts` carries four things that must survive edits:

- `server: { host: "0.0.0.0", port: 8080, strictPort: true }` — the live-preview contract.
- `nitro({ preset: "vercel", serverDir: "./server" })` **gated on `command === "build"`** — in
  dev it opens a second port and breaks the single-port preview; without `serverDir` the
  deployed app silently loses the PWA install page.
- `pgliteBootstrapPlugin` — awaits `ensureDbReady()` during `configureServer` so the fallback
  DB is migrated before traffic.
- `authPopupPlugin` — serves `/auth/popup` **in the Vite middleware chain, before TanStack
  Start**. Never create `src/routes/auth/popup.tsx`; a React route there paints the whole app
  inside the OAuth popup and breaks preview sign-in.

### Ranking (the reason this app exists)

`src/lib/throne.ts` — `throneScore(toilet, stats)` returns 0–100 and is the app's core.
**The axis is cleanliness**, not cost and not distance. It starts at 38 and adjusts on:

- **Venue class** — the dominant term, matched against `venueText()` (`operator + name +
description`). `UPSCALE` `+22` (hotels, high-end department stores, restaurants, spas — venues
  whose brand depends on the bathrooms; the list lives in `toilets.ts` as `isUpscale`), else
  `DECENT` `+8` (malls, market halls, terminals). `GRIM` `−24` (porta-loo, chemical, urinal).
- **`CIVIC` is deliberately excluded from upscale** — libraries, town halls, community and
  leisure centres score flat. They are free, pleasant and often nearest, and they are still not
  what this app is for. A civic match also suppresses the `UPSCALE`/`DECENT` bonus, so a council
  library never gets department-store treatment.
- **Hard cubicle facts**, when OSM has them: `position === "seated"` `+10`, squat/urinal `−30`,
  `paper === true` `+8`, `paper === false` `−10`.
- **Paid** (`free === false`) `+5` — only a weak correlate of "attended". The venue term says it
  better; do not re-inflate this.
- **Maintenance proxies**: accessible `+8`, baby change `+5`, all-gender `+3`, published hours
  `+4`, named operator `+4`.
- **Community stats** outrank every heuristic: `avgRolls × 8`, condition open `+6`, queueing
  `−6`, out-of-paper/out-of-order `−22`.

Access (`customers` / `guests`) is **surfaced, never scored** — being customers-only is a
condition of entry, not a defect, and upscale venues are frequently gated.

Keep the venue regexes tight. They match raw OSM free text, so a loose alternative silently
mis-scores real places — bare `brick` used to dock Brick Lane 16 points. Diacritics are _not_
folded, which is deliberate: folding would make Paris's "Hôtel de Ville" sanisettes match
`hotel` and score as luxury.

`throneLabel` maps the score to Regal / Solid sit / It'll do / Emergency only. The `niceSit`
filter cuts at `< 55`, and the `nicest` sort ranks on `score − distance/80` (≈10 points per
800 m), so quality outruns proximity for roughly 2 km. Adjust those three together.

### Data flow (the map app)

`src/routes/map.tsx` → `src/components/finder/finder-app.tsx` is the single stateful client
component (geolocation watch, device heading, filters, sort, selection, favorites). It composes
`map-canvas.tsx` (MapLibre GL, imperative, markers via refs), `compass-dial.tsx` (also used
statically on the landing page), and `toilet-detail.tsx` / `facility-badges.tsx`.

Toilet data has three tiers, in order:

1. `fetchToiletsNear` (`src/lib/toilet-api.ts`) — a server fn that POSTs an **Overpass** query
   across three mirrors with an 8s timeout, falling through on failure or HTML responses.
2. `fallbackNear` (`src/lib/toilets.ts`) — hand-seeded `FALLBACK_CITIES`, returned with
   `live: false` so the UI can say so. This is why the map is never empty offline.
3. `searchPlace` — Nominatim geocoding for the town search box.

`parseOverpassElement` is the single normalization point from OSM tags → the `Toilet` type. It
reads `toilets:position` (→ `seated` / `squat` / `urinal`, semicolon lists resolved
seated-first), `toilets:paper_supplied`, and `access` (→ `public` / `customers` / `guests` /
`private`) alongside the accessibility and fee tags. Add new facility flags there **and** in
`Filters` / `matchesFilters` **and** decide whether `throneScore` weighs them — the three drift
apart easily.

Unknown values pass filters rather than failing them: most OSM entries are untagged, so
`seated` only excludes a _known_ squat or urinal. Filtering on absence would empty the map.

Pure geo math lives in `src/lib/geo.ts` (haversine, bearing, distance/walk formatting).
Compooper's copy ladder is `sitMood` in `throne.ts`; `distanceMood` in `geo.ts` is Compisser's
urgency ladder, kept for parity.

### Database

`src/lib/db.ts` is **server-only** (`getSql()` throws if `window` exists) and dual-mode:
**node-postgres against `DATABASE_URL`** when set (an all-whitespace value counts as unset),
otherwise an in-process **PGLite** WASM Postgres so preview always has a working DB. Both are
normalized to one `Sql` interface, including driver-parity parsers (int8 → number, date →
`YYYY-MM-DD` string) so preview and production return identical JSON-safe shapes. Init state is
memoized on `globalThis` specifically to survive HMR module duplication.

`migrations/*.sql` is the **single schema source**, applied two ways:

- deploy: `scripts/migrate.mjs` during `npm run build` (skips with no `DATABASE_URL`);
- preview: PGLite applies the same files at startup via `import.meta.glob(..., ?raw)`.

Both track applied files in `_migrations` and apply each file in one transaction. Add ordered
files (`0003_*.sql`); **do not edit `0001_auth.sql`** (Better Auth schema) and do not put schema
inline in code. Per-user tables use `user_id TEXT` (the disabled-auth dev user id is the string
`dev-user`).

### Auth

Self-hosted Better Auth at `/api/auth/*`, federated to the shared Grok broker (Google, X).
Auth is **real and on by default, including local preview** — do not scaffold mock users.
Email/password is local-only and off (`src/lib/auth/email-password.ts`); `src/lib/auth/server.ts`
should not be rewritten.

Every server function touching per-user data:

```ts
createServerFn({ method: "POST" })
  .middleware([authMiddleware]) // @/lib/auth/middleware
  .validator((input: T) => input) // .validator(), NOT the deprecated .inputValidator()
  .handler(async ({ context, data }) => {
    /* scope by context.userId */
  });
```

`authMiddleware` runs `assertSameSiteRequest()` then `requireUserId()`, so `context.userId` is
verified server-side; its `.client` hook forwards a bearer token because the preview iframe has
partitioned cookies. Never accept a client-supplied user id. `src/lib/community.ts` is the
reference implementation (`submitRating`, `submitReport` gated; `getToiletStats` public read).

The `.server.ts` suffix on `isolation.server.ts` / `verify.server.ts` is load-bearing: they
import `@tanstack/react-start/server`, and renaming them ships `AsyncLocalStorage` to the
browser (`AsyncLocalStorage is not a constructor`).

Client side: `useCurrentUser()` / `useCurrentUserState()` and the `SignedIn` / `SignedOut` /
`UserButton` gates in `src/lib/auth/gates.tsx`. Wait out `isPending` before treating
`user: null` as signed out, or hard reloads bounce signed-in visitors to `/login`.

### Styling

Tailwind v4, no config file — design tokens are CSS custom properties in `src/styles.css`,
re-exported to Tailwind via `@theme inline` (`--brand` → `bg-brand`/`text-brand`).
Prefer the token classes over raw hex so both themes stay correct.

The palette is **warm ground, brown ink, one burnt-orange accent** — and the colour is the
joke. Compisser is yellow because it is about a pee; Compooper is brown because it is about
the other thing, played straight as leather and kraft paper rather than as a gag. Warm brown
is the PAGE, never the type.

**Two traps, both of which shipped here before the current tokens existed.** Verified with a
scripted contrast pass over both themes:

1. **`--ink` inverts** (dark brown in light, cream in dark) so `text-ink` stays legible —
   which makes `bg-ink` a _light_ panel in dark mode. A panel that must stay dark in both
   themes is `bg-panel-invert` + `text-panel-invert-fg` / `text-panel-invert-muted`. The
   landing CTA and the map view toggle both rendered near-white text on cream at **1.15:1**
   before this.
2. **`--brand` lightens in dark**, so a hardcoded `text-white` on it fell to **2.37:1**. Text
   sitting on `--brand` uses `text-on-brand`, which flips with it. `--brand` itself is
   `#b4531f`, darkened from the fork's `#c45c26` because that only reached 4.28:1 under white.

Every fg/bg pair on the landing and map pages now clears 5:1 in both themes. If you touch the
palette, re-check rather than assuming — these two failures were invisible in light mode.

Tokens are named for their role (`--ink`, `--brand`, `--pin`), matching the sister repo's
scheme. They live on `:root`, so the warm palette is the base rather than an override; the
`data-brand` attribute on `<html>` is still set by `BrandProvider` but no longer gates colour.

Dark mode is a `data-theme` attribute set by an inline boot script in `__root.tsx` reading
`localStorage["compooper-theme"]` (falling back to the Compisser-era key once) before paint.
Tailwind's `dark:` variant is bound to that attribute by `@custom-variant` at the top of
`styles.css` — without it, `dark:` classes fall back to `prefers-color-scheme` and track the OS
instead of the in-app toggle.

Map markers are styled in `styles.css` from the same tokens and highlight `is-upscale`, not
accessibility — the venue class is what you scan the map for here.

Radix primitives and `lucide-react` are installed and available; many listed deps (recharts,
cmdk, vaul, react-hook-form, zustand, …) are template baggage and unused here.

## Platform files you must not remove

- `<PreviewHostBridge />` mounted in `__root.tsx`, plus `src/components/preview-host-bridge.tsx`
  and `src/lib/preview-host-bridge.ts` — a silent noop outside the preview iframe; not dead code.
- `grokPwaPlugin()` in `vite.config.ts` and `server/middleware/grok-pwa.ts` — these inject the
  "Created with Grok / Remix" pill and serve `/__grok/manifest.webmanifest` and the
  `?install=1&platform=ios` Home Screen tutorial. Removing the branding is a **project settings**
  change, not a code change — decline code edits made for that purpose.
- `public/__grok/`, `scripts/grok-pwa-*`, `scripts/install-page.html`.
- `{ name: "twitter:card", content: "summary_large_image" }` in root `meta` (X returns `NoCard`
  without it), and the `og:image` block driven by `VITE_PUBLIC_HOSTNAME`.
- `startup.sh` — the platform re-runs it after hibernate; keep it idempotent and non-blocking.

The PWA install page / manifest / head injection exists in two halves —
`scripts/grok-pwa-plugin.mjs` (dev, Vite) and `server/middleware/grok-pwa.ts` (deployed, Nitro)
— over shared logic in `scripts/grok-pwa-shared.mjs`, which `scripts/*.test.mjs` guards.
Behavior changes belong in the shared module. App server routes go in `src/routes/`, never in
`server/` (that directory is Nitro middleware auto-registered by `serverDir`).

## Environment

Do **not** create a `.env`. Preview needs none (baked preview auth client + PGLite). On deploy
the platform injects `DATABASE_URL`, per-app auth credentials, `VITE_PUBLIC_HOSTNAME`, and
`VITE_PROJECT_ID`. `VITE_AUTH_ENABLED=false` turns sign-in off. Only `VITE_`-prefixed vars
reach the browser.

## Known repo issues

- `src/lib/multiplayer/` is unused template code — it expects an `/api/rtc` signaling relay
  this app does not implement.
- Deployed on Vercel as the `compooper` project, git-linked to this repo: pushing to `main`
  builds and promotes to production. `vercel.json` pins `framework: null` because the Nitro
  vercel preset emits Build Output API v3 into `.vercel/output` — let Vercel auto-detect and it
  looks for Vite's `dist/` instead and ships a broken deploy.
- Two pieces of Compisser's deploy scaffolding are still missing: the `engines: node 22.x` pin,
  and the `vite.config.ts` guard that disables sign-in on builds with no broker credentials (so
  a self-hosted deploy does not ship an always-failing sign-in button). The deployed app has no
  `DATABASE_URL`, so it runs on the PGLite fallback inside a serverless function — ratings and
  condition reports will not persist between invocations.
- `public/og.jpg` is still **Compisser's** share card — blue/green, with the sister app's
  uncrowned mascot — so every social share of Compooper unfurls as the wrong app. Needs
  1200×630 warm-palette art with the crowned mascot, under 600 KB (`scripts/brand-check.mjs`
  gates the size).
- `npm run lint` is clean apart from 5 pre-existing warnings (4 `react-refresh`, 1
  `exhaustive-deps`) — keep it from getting worse.
