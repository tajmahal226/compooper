# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Compooper ranks nearby public bathrooms by how pleasant they are to actually sit
in (not just proximity) and points a compass at the winner. Sister app to
[Compisser](https://github.com/tajmahal226/compisser), the emergency toilet finder.

## Commands

```bash
npm run dev          # Vite dev server on 0.0.0.0:8080 (strictPort — the live-preview contract)
npm run build        # vite build, then npm run db:migrate
npm run db:migrate   # apply migrations/*.sql to DATABASE_URL (no-op when unset)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier --write .
npm test             # node --test 'scripts/**/*.test.mjs'
```

Tests only cover the two build-tooling modules (`scripts/brand-check.test.mjs`,
`scripts/grok-pwa-plugin.test.mjs`); there is no runner wired up for `src/`.

```bash
node --test scripts/brand-check.test.mjs                       # one file
node --test --test-name-pattern "og:type" scripts/*.test.mjs   # one test
node scripts/browser-smoke.mjs                                 # headless load + screenshot of :8080
```

`browser-smoke.mjs` (and `preview-thumbnail.mjs`) only accept http/https
loopback URLs and write PNGs under `/workspace` — enforced by
`scripts/browser-guard.mjs`. `./startup.sh` starts the dev server only if
nothing already answers on port 8080.

## Architecture

### Routing

TanStack Start (SSR) with file-based routes in `src/routes/`.
`src/routeTree.gen.ts` is generated and lint-ignored — never hand-edit it.
`src/routes/compooper/*` are legacy redirect stubs that bounce to the
top-level `/`, `/map`, `/download`; put real UI in the top-level routes.

### Finder domain

The ranking pipeline spans four small modules plus one big component:

- `src/lib/toilets.ts` — the `Toilet` type, `parseOverpassElement` (OSM tag →
  `Toilet`), `Filters` + `matchesFilters`, and `FALLBACK_CITIES` seed data.
- `src/lib/toilet-api.ts` — `createServerFn` wrappers: `fetchToiletsNear` races
  three Overpass mirrors with an 8s timeout and degrades to `fallbackNear`;
  `searchPlace` hits Nominatim.
- `src/lib/throne.ts` — `throneScore` (0–100 "would you sit here", blending OSM
  tags with community stats) and `dumpMood`. This is the app's whole point;
  change it deliberately.
- `src/lib/geo.ts` — `haversineMeters`, `bearingDegrees`, `formatDistance`,
  `formatWalk`, `mapsWalkUrl`, `distanceMood`. Reuse these rather than
  re-deriving distance/bearing math.
- `src/components/finder/finder-app.tsx` — the one stateful component (~650
  lines) owning the geolocation watch, the `deviceorientation` compass heading
  (iOS needs the `requestPermission` gesture), filters, sort, and the
  map/compass view toggle.

Community ratings and condition reports live in `src/lib/community.ts` as
authenticated server functions; reports expire after 6 hours.

### Database

`src/lib/db.ts` exposes a single **server-only** `getSql()` (it throws if
called in the browser). It is backed by Neon via `pg` when `DATABASE_URL` is
set, and by embedded PGLite (Postgres-in-WASM, in-memory, wiped on restart)
otherwise — so preview works with zero config and the swap needs no code
changes. Driver result types are normalized across both backends (int8 →
`number`, date → `'YYYY-MM-DD'`).

`migrations/*.sql` is the single source of schema truth: `scripts/migrate.mjs`
applies it against Neon during `npm run build`, and PGLite applies the same
files at startup. Never create tables inline in a server function. Add new
ordered files (`0003_*.sql`, …); `0001_auth.sql` is Better Auth's generated
schema — do not edit it. Per-user tables use `user_id TEXT` (the disabled-auth
dev user id is the string `dev-user`).

### Auth

Self-hosted Better Auth at `/api/auth/*`, federating to a shared "Grok auth
broker" via `genericOAuth` (`src/lib/auth/providers.ts` lists the upstreams).
Three modes: deployed (injected `GROK_AUTH_*` + `DATABASE_URL`), sandbox live
preview (baked preview client, PGLite persistence, bearer-token sessions
because the iframe's cookies are partitioned), and off (`VITE_AUTH_ENABLED=false`
→ shared dev user, which fails closed if a real `DATABASE_URL` is present).

- Server functions touching per-user data: `.middleware([authMiddleware])`,
  then scope every query by `context.userId` — see `src/lib/community.ts`.
- Components: `useCurrentUserState()` from `src/lib/auth/use-current-user.ts`.
  Wait out `isPending` before treating `user: null` as signed out, otherwise
  hard reloads bounce signed-in visitors to `/login`.
- `src/lib/auth/server.ts` is pre-wired (broker endpoints, `__Host-` cookies,
  the `bearer` plugin, `tanstackStartCookies` last) — treat it as
  do-not-rewrite; toggle local email/password in `email-password.ts` only.
- The `.server.ts` suffix on `isolation.server.ts` and `verify.server.ts` is
  load-bearing: those import `@tanstack/react-start/server`, and renaming them
  makes Vite ship `AsyncLocalStorage` to the browser.

### Build-time plumbing (easy to break)

`vite.config.ts` registers three template plugins, in order: PGLite bootstrap
(awaited in `configureServer`), the `/auth/popup` middleware — which **must**
run before `tanstackStart()` so a React route can never win that path — and the
PWA plugin. `nitro` is gated to `command === "build"` (enabling it in dev opens
a second port and breaks the single-port preview), and its
`serverDir: "./server"` is the only reason `server/middleware/grok-pwa.ts` gets
registered.

The PWA install page / manifest / head injection exists in two halves —
`scripts/grok-pwa-plugin.mjs` (dev, Vite) and `server/middleware/grok-pwa.ts`
(deployed, Nitro) — over shared logic in `scripts/grok-pwa-shared.mjs`. Behavior
changes belong in the shared module so both halves stay in sync.

### Styling

Tailwind v4. Design tokens are CSS custom properties in `src/styles.css`,
re-exported to Tailwind through `@theme inline`, and overridden by
`html[data-theme="dark"]` and `[data-brand="compooper"]` (the brand attribute is
set by `BrandProvider` in `src/lib/brand.tsx`, which also holds the app's copy:
CTA labels, taglines, default sort). Use the token classes (`bg-card`,
`text-muted`, `border-card-border`, `text-blue`) instead of raw hex.

## Conventions

- `@/*` resolves to `src/*`; strict TypeScript.
- Prettier: 100 columns, double quotes, semicolons, trailing commas.
- `src/lib/multiplayer/` is unused template code — it expects an `/api/rtc`
  signaling relay that this app does not implement.
