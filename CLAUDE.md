# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Compooper** — a public-bathroom finder that ranks bathrooms by whether they are worth
_sitting in_, then points a compass dial at the winner. MapLibre map, OSM-sourced toilet
data, community ratings and condition reports.

It is the sister app to [**Compisser**](https://github.com/tajmahal226/compisser), and the
split between them is the whole product thesis:

|               | Compisser                    | Compooper                                    |
| ------------- | ---------------------------- | -------------------------------------------- |
| Use case      | Pee — urgent                 | Poop — you need a proper sit                 |
| Optimizes for | **Proximity.** Nearest wins. | **Quality.** Paid or upscale-and-clean wins. |
| Default sort  | `distance`                   | `nicest` (`brand.defaultSort`)               |

The practical consequence, and the thing most likely to be "fixed" wrongly: **paying is a
positive signal here, not a cost to avoid.** A turnstile or an attendant means someone
restocks the paper and mops the floor. Compisser's free-first instinct is backwards for
Compooper. See `src/lib/throne.ts`.

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

`src/lib/throne.ts` — `throneScore(toilet, stats)` returns 0–100 and is the app's core. It
starts at 38 and adjusts on:

- **Paid** (`free === false`) `+12` — attended, therefore stocked. Not a penalty. See above.
- **Venue tier**, matched against `operator + name + description`: `UPSCALE` (hotel, museum,
  library, department store, …) `+18`, else `DECENT` (mall, centre, station, market, …) `+8`;
  `GRIM` (porta, chemical, urinal, …) `−24`. A urinal is disqualifying, not merely bad.
- **Cubicle proxies**: accessible `+8` (full-size lockable stall), baby change `+5`, all-gender
  `+3`, published hours `+4`, named operator `+4` — each is a proxy for "someone maintains this".
- **Community stats** outrank every heuristic: `avgRolls × 8`, condition open `+6`, queueing
  `−6`, out-of-paper/out-of-order `−22`.

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

`parseOverpassElement` is the single normalization point from OSM tags → the `Toilet` type
(accessible / babyChange / free / allGender / radarKey). Add new facility flags there **and**
in `Filters` / `matchesFilters` together — and decide whether `throneScore` should weigh them.

Pure geo math lives in `src/lib/geo.ts` (haversine, bearing, distance/walk formatting).
Compooper's copy ladder is `dumpMood` in `throne.ts`; `distanceMood` in `geo.ts` is Compisser's
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
re-exported to Tailwind via `@theme inline` (`--card` → `bg-card`, `--muted` → `text-muted`).
Prefer the token classes over raw hex so both themes stay correct.

Three layers set those tokens, in cascade order: `:root` (Compisser's blue/green base),
`html[data-theme="dark"]`, then `[data-brand="compooper"]` and
`html[data-theme="dark"] [data-brand="compooper"]` — the brand attribute is set by
`BrandProvider` in `src/lib/brand.tsx`, which also holds the app's copy (CTA labels, tagline,
default sort, sister-app blurb).

**The token names are inherited from Compisser and lie.** Under the compooper brand `--blue`
is burnt orange (`#c45c26`), `--navy` is dark brown, and `--green-pin` is amber. Read the value
before assuming a color; do not "correct" a `text-blue` class to a blue Tailwind palette color.

Dark mode is a `data-theme` attribute set by an inline boot script in `__root.tsx` reading
`localStorage["compisser-theme"]` (the key is shared with the sister app) before paint.
Tailwind's `dark:` variant is bound to that attribute by `@custom-variant` at the top of
`styles.css` — without it, `dark:` classes fall back to `prefers-color-scheme` and track the OS
instead of the in-app toggle, which mixes light gradients into dark cards.

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
- Compisser has deploy scaffolding this fork lacks: `vercel.json`, an `engines: node 22.x` pin,
  and a `vite.config.ts` guard that disables sign-in on builds with no broker credentials (so a
  self-hosted deploy does not ship an always-failing sign-in button). Port them if this app is
  deployed outside the Grok platform.
- `npm run lint` is clean apart from 5 pre-existing `react-refresh/only-export-components`
  warnings — keep it from getting worse.
