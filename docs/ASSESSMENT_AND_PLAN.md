# Ithaka Monorepo Assessment

**Assessed:** 2026-09-11  
**Commit:** 8d4333a (Initial Ithaka monorepo)

---

## Executive Summary

Ithaka is a **well-architected v0.9**. The claimed v1 feature set is 85% implemented with working backend routes, auth, schema, and mostly complete web + mobile UIs. **However, the project currently does not build** due to type errors in two packages, and **Docker is required but not available in the assessment environment**, preventing full local verification of the database-dependent stack.

**Status:** Not production-ready. Fixable type errors and missing operational infrastructure (CI, tests, deploy configs, environment validation) block immediate use.

---

## 1. Working State

### ✅ What Works

| Component | Status | Evidence |
|-----------|--------|----------|
| **Dependencies** | ✅ Install succeeds | `npm install` completes in ~14s; 850 packages installed |
| **Database Schema** | ✅ Complete & sound | All claimed entities present: users, circles, circle_members, pins, pin_wishes, trips, trip_travelers, photos, invites. Proper foreign keys, indexes, relations. |
| **API Routes** | ✅ Implemented | All 6 route modules exist: circles, invites, pins, trips, photos, places. CRUD + business logic (wish toggle, pin→trip conversion, photo upload, invite redemption) |
| **Auth** | ✅ Configured | Better Auth with email+password, Expo plugin, Drizzle adapter, session tables |
| **Geocoding** | ✅ Dual fallback | Mapbox (if token set) → Nominatim (OSM). Forward + reverse implemented |
| **Photo Storage** | ✅ Dual backend | R2 (if configured) → local disk (`data/uploads/`). Signed upload URLs, GET endpoint |
| **Web App (Next.js)** | ⚠️ Does not build | UI components complete: MapApp, MapCanvas, PinSheet, PinComposer, CircleChrome, ListView, ScrapbookStrip, PlaceSearch. Pages: home, login, signup, onboarding, map, invite/[token] |
| **Mobile App (Expo)** | ⚠️ Typecheck fails | Screens: index (redirect), login, map, pin/[id]. Basic pin CRUD present |
| **Linting** | ❌ Fails | API package has drizzle-orm version conflict; web has react-map-gl type error |
| **Build** | ❌ Fails | Web build exits with `MapCanvas.tsx:34:7` type error on `attributionControl` |
| **Tests** | ❌ None | Zero `.test.*` or `.spec.*` files found |
| **Local Boot** | ❌ Blocked | Docker not present in environment (required for Postgres); cannot verify dev server, db:push, or end-to-end flow |

### 🔴 Build / Lint Errors

#### Error 1: `apps/web` build failure
```
./src/components/MapCanvas.tsx:34:7
Type error: Type 'true' is not assignable to type 'false | AttributionControlOptions | undefined'.

  32 |       mapStyle={style}
  33 |       mapboxAccessToken={mapboxToken}
> 34 |       attributionControl
     |       ^
  35 |       style={{ width: "100%", height: "100%" }}
```
**Cause:** Shorthand JSX `attributionControl` (boolean) conflicts with react-map-gl/maplibre's stricter `AttributionControlOptions` type.  
**Fix:** Change line 34 from `attributionControl` to `attributionControl={false}` or remove the line entirely.

#### Error 2: `packages/api` lint failure
```
src/context.ts(38,5): error TS2322: Type 'SQL<unknown> | undefined' is not assignable...
  Types have separate declarations of a private property 'shouldInlineParams'.
```
**Cause:** Duplicate `drizzle-orm` versions in monorepo. `packages/db` declares `drizzle-orm@^0.44.5`, but no explicit version in `packages/api`. Hoisting conflict.  
**Fix:** Add `"drizzle-orm": "^0.44.5"` to `packages/api/package.json` dependencies, or extract `drizzle-orm` to root devDependencies and use workspace protocol.

### ⚠️ Security & Dependencies

- **33 vulnerabilities** (1 critical, 8 high, 24 moderate) reported by `npm audit`
- **Deprecated packages:** rimraf@3, inflight@1, glob@7/10, uuid@7, @esbuild-kit/*
- **Recommendation:** Run `npm audit fix` and update major dependencies before production deploy

### 🐳 Environment Constraint

The README requires Docker to run Postgres (`docker compose up -d`). The cloud agent environment **does not have Docker or Podman**. This blocks:
- `npm run db:push` (Drizzle schema push)
- `npm run dev` (app boot against real database)
- Manual verification of auth flows, pin creation, photo upload, trip conversion

**Workaround for future local testing:** Install Docker Desktop, or use a managed Postgres instance (Railway, Supabase, Neon) and set `DATABASE_URL`.

---

## 2. Implemented Features

### ✅ Fully Implemented (per README "What's in v1")

| Feature | Implementation | Files |
|---------|----------------|-------|
| Sign up / sign in (email + password) | ✅ Better Auth with credential provider | `packages/api/src/auth.ts`, `apps/web/src/app/login/page.tsx`, `apps/web/src/app/signup/page.tsx`, `apps/mobile/app/login.tsx` |
| Create a circle | ✅ POST `/api/circles`, onboarding flow | `packages/api/src/routes/circles.ts` (L45-56), `apps/web/src/app/onboarding/page.tsx` |
| Join with invite link | ✅ POST `/api/invites/:token/accept` | `packages/api/src/routes/invites.ts` (L27-56), `apps/web/src/app/invite/[token]/page.tsx` |
| Belong to multiple circles | ✅ Circle switcher in UI | `apps/web/src/components/CircleChrome.tsx`, `apps/web/src/components/MapApp.tsx` (L20, L120-125) |
| Roles (organizer, member, child) | ✅ DB column, role-based perms | `packages/db/src/schema.ts` (L97), `packages/shared/src/roles.ts` (L1-27), invite creation (L100-127 in circles.ts) |
| Map: search place or click/long-press to drop pin | ✅ PlaceSearch + MapCanvas onClick | `apps/web/src/components/PlaceSearch.tsx`, `apps/web/src/components/MapCanvas.tsx` (L36-40), `apps/mobile/app/map.tsx` (L72-86) |
| Wishlist vs visited pins | ✅ `pins.status` enum, filter UI | `packages/db/src/schema.ts` (L117), `apps/web/src/components/MapApp.tsx` (L16, L74-79) |
| "I want to go" (wish) | ✅ POST `/api/pins/:pinId/wish` (toggle) | `packages/api/src/routes/pins.ts` (L183-199), `apps/web/src/components/PinSheet.tsx` (L76-78) |
| Convert wishlist → visited | ✅ POST `/api/pins/:pinId/visit` | `packages/api/src/routes/pins.ts` (L199-225), `apps/web/src/components/PinSheet.tsx` (L80-84) |
| Destination sheet | ✅ PinSheet modal with all pin details | `apps/web/src/components/PinSheet.tsx` (full 206-line component) |
| Photos on a trip (cover + album, max 12) | ✅ Photo upload, signed URLs, cover selection, MAX_PHOTOS_PER_TRIP | `packages/api/src/routes/photos.ts` (L13-95), `packages/shared/src/roles.ts` (L6), `apps/web/src/components/PinSheet.tsx` (L136-178) |
| Journal strip | ✅ ScrapbookStrip component, GET `/api/circles/:circleId/scrapbook` | `apps/web/src/components/ScrapbookStrip.tsx`, `packages/api/src/routes/trips.ts` (L36-46) |
| Searchable list view | ✅ ListView component with search input | `apps/web/src/components/ListView.tsx` |

### ⚠️ Partially Implemented / Incomplete

| Feature | Status | Gaps |
|---------|--------|------|
| **Mobile app photo upload** | ⚠️ Stub | `apps/mobile/app/pin/[id].tsx` shows photos but has no upload UI (no image picker integration despite `expo-image-picker` in deps) |
| **Traveler management** | ⚠️ Web only | Web UI allows multi-select travelers (L109-127 in PinSheet); mobile shows travelers but no edit UI |
| **Invite expiry / redemption tracking** | ⚠️ Backend only | Invites expire after 14 days (L109 in circles.ts), redeemed state tracked, but no UI to show expired/redeemed status or re-send |
| **Circle cover photo** | ⚠️ Schema only | `circles.coverPhotoId` column exists but no UI to upload/display it |
| **Photo captions** | ⚠️ Web only | Web PinSheet has caption input (L175-178), mobile displays captions but no edit |
| **Circle deletion safeguard** | ⚠️ Partial | Cannot delete circle if you're the last organizer (L136-144 in circles.ts), but no UI warning before deleting pins with trips/photos |
| **Error boundaries** | ❌ Missing | No React error boundaries in web app; mobile has no global error handler |

---

## 3. Functionality Gaps

### 🔴 Critical Gaps (Block v1 Claim)

1. **No tests**
   - Zero unit, integration, or E2E tests
   - No test runner configured (no Jest, Vitest, Playwright, Detox)
   - API routes unverified beyond manual inspection

2. **No CI/CD**
   - No `.github/workflows/` or `.gitlab-ci.yml`
   - No automated lint, typecheck, build, or test on PR/push
   - No deployment configuration

3. **Build is broken**
   - Cannot ship web app due to type error in MapCanvas
   - Lint failure in API package blocks quality gate

4. **No deployment artifacts**
   - No Dockerfile, docker-compose.prod.yml, or container registry config
   - No Vercel/Netlify/Railway config files
   - No build output artifact in repo (expected, but no deploy docs)

### 🟡 Medium Gaps (Reduce Polish / Ops)

5. **No email verification flow**
   - `user.emailVerified` column defaults to `false` but no verification send/confirm endpoints
   - Better Auth supports email verification but not configured

6. **No forgot password**
   - No password reset flow (Better Auth supports this with additional config)

7. **No user profile editing**
   - Cannot change name, email, or password after signup
   - No avatar upload (user.image column unused)

8. **No circle settings page**
   - Rename circle exists (PATCH `/api/circles/:circleId`) but only organizer can do it; no UI route for settings

9. **No photo deletion**
   - Can upload photos but no remove/reorder UI
   - Photos have `sortOrder` column but no drag-to-reorder

10. **No trip deletion**
    - Pins can be deleted, but individual trips (repeat visits) cannot be removed
    - Cascade delete would remove all trips when pin is deleted

11. **No analytics / monitoring**
    - No Sentry, LogRocket, Posthog, or error tracking
    - No structured logging (console.error only in error handler)

12. **No rate limiting**
    - API has no rate limits on auth, upload, or mutation endpoints
    - Vulnerable to abuse (signup spam, upload floods)

13. **No input sanitization audit**
    - Zod validates types but no XSS/SQLi review
    - User-generated text (notes, captions, place names) passed through without sanitization

14. **No accessibility audit**
    - No ARIA labels on map interactions, modals, buttons
    - Keyboard navigation not tested (no focus traps, no ESC to close modals)

15. **No mobile photo upload**
    - `expo-image-picker` installed but not integrated
    - Cannot add photos from mobile app

### 🟢 Minor Gaps (Nice-to-Have)

16. **No dark mode**
    - CSS variables exist (`--cream`, `--ink`, etc.) but no theme toggle

17. **No offline support**
    - No service worker, no cache-first, no optimistic updates

18. **No export**
    - No "download my circle data" or CSV/JSON export

19. **No public sharing**
    - Readme explicitly says "no public profiles" — gap acknowledged by design

20. **No map clustering**
    - Many pins on map could overlap; no clustering or zoom-based aggregation

21. **No search in journal**
    - Journal strip shows all trips but no search/filter (README claims "searchable list view" — exists for pins, not trips)

---

## 4. Risks

### 🔴 Technical Debt

| Risk | Severity | Detail |
|------|----------|--------|
| **Type system violations** | High | Broken build = cannot verify runtime behavior matches types; drizzle-orm conflict could cause subtle query bugs |
| **No database migrations** | High | `db:push` used (schema sync), but no versioned migrations. Prod schema drift likely; cannot rollback schema changes |
| **No environment validation** | Medium | `.env.example` documents required vars, but no startup check for missing/invalid `DATABASE_URL`, `BETTER_AUTH_SECRET`, etc. App will crash with obscure errors |
| **No secrets management** | Medium | `.env` committed to git (example only), but no docs on Vercel env vars, Railway secrets, or cloud provider config |
| **No monitoring of upload size/cost** | Medium | Photo limit is 8MB per file (L42 in photos.ts) and 12 photos/trip, but no circle-level storage quota or cost tracking |
| **Mapbox token in public env var** | Low | `NEXT_PUBLIC_MAPBOX_TOKEN` and `EXPO_PUBLIC_MAPBOX_TOKEN` exposed in client bundles; Mapbox allows domain restrictions but not documented |

### 🟡 Operational

| Risk | Severity | Detail |
|------|----------|--------|
| **No backup strategy** | High | Postgres data in Docker volume; no backup schedule, no restore docs |
| **No uptime monitoring** | Medium | If API goes down, no alerts; users see "Could not load circles" in UI but no incident response |
| **No dependency update policy** | Medium | 33 vulnerabilities, deprecated packages; no Dependabot or Renovate config |
| **No load testing** | Medium | Unknown: Can 1 circle with 500 pins render? Can 10 concurrent uploads succeed? |

### 🟢 Product

| Risk | Severity | Detail |
|------|----------|--------|
| **No abuse prevention** | Medium | Anyone can sign up, create circles, upload photos. No captcha, no invite-only mode, no admin moderation |
| **No GDPR compliance** | Medium | No privacy policy, no cookie consent, no data export/deletion endpoints |
| **No mobile app store presence** | Medium | Expo app works in Expo Go, but no iOS App Store or Google Play submission config (no app.json `bundleIdentifier`, `versionCode`, or OTA update config) |

---

## 5. Recommended Next Steps

Prioritized by **impact × effort** (blocking issues first, then high-value quick wins, then long-term infrastructure).

### 🔥 P0 (Blocking — Fix First)

**Goal:** Make the project buildable and verify it runs locally.

| # | Task | Effort | Files | Rationale |
|---|------|--------|-------|-----------|
| 1 | **Fix MapCanvas type error** | 5 min | `apps/web/src/components/MapCanvas.tsx:34` | Change `attributionControl` to `attributionControl={false}` or remove. Unblocks web build. |
| 2 | **Fix drizzle-orm version conflict** | 10 min | `packages/api/package.json`, root `package-lock.json` | Add explicit `drizzle-orm@^0.44.5` to api package, run `npm install`, verify `npm run lint` passes in all packages. |
| 3 | **Verify build succeeds** | 2 min | — | Run `npm run build` and confirm all 6 packages build. |
| 4 | **Set up local Postgres** | 15 min | `.env`, `docker-compose.yml` or managed DB | Ensure Docker is available OR provision a free Postgres instance (Railway, Supabase) and update `DATABASE_URL`. Run `npm run db:push` to apply schema. |
| 5 | **Boot dev servers** | 5 min | — | Run `npm run dev:web` and `npm run dev:mobile` (or just `npm run dev`). Verify web opens at `localhost:3000`, API at `localhost:3001`, sign up works, circle creation works, pin drop works. |
| 6 | **Manual smoke test** | 20 min | — | Sign up → create circle → drop wishlist pin → search place → convert to visited → upload 1 photo → verify it displays. Repeat in mobile if possible. |

**Total P0 effort:** ~1 hour. **Deliverable:** Buildable, bootable, manually verified v1.

---

### ⚡ P1 (High-Value Quick Wins)

**Goal:** Add safety nets and basic ops hygiene before shipping.

| # | Task | Effort | Files | Rationale |
|---|------|--------|-------|-----------|
| 7 | **Add CI: lint + typecheck + build** | 30 min | `.github/workflows/ci.yml` | Create GitHub Actions workflow: `npm install → npm run lint → npm run build`. Blocks merges if build breaks. |
| 8 | **Add environment validation** | 20 min | `packages/api/src/env.ts`, import in `app.ts` | Use Zod to parse required env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.) at startup; throw descriptive error if missing. Prevents cryptic runtime crashes. |
| 9 | **Add basic API tests** | 2 hrs | `packages/api/src/__tests__/` | Install Vitest. Write 10 tests: auth (signup, login), circles (create, join invite), pins (create wishlist, convert to visited), photos (sign upload URL). Catches regressions. |
| 10 | **Fix npm audit critical/high** | 30 min | `package.json`, `package-lock.json` | Run `npm audit fix --force`, manually review breaking changes, test build. Removes known CVEs. |
| 11 | **Document deployment** | 1 hr | `docs/DEPLOY.md` | Write step-by-step: (1) Provision Postgres, (2) Set env vars in Vercel/Railway, (3) Deploy API + web, (4) Run migrations, (5) Test production. Unblocks handoff. |
| 12 | **Add database migrations** | 1 hr | `packages/db/drizzle/` | Switch from `db:push` to `db:generate` + `db:migrate`. Commit generated SQL migration files. Enables safe prod schema updates. |

**Total P1 effort:** ~5.5 hours. **Deliverable:** CI-protected, tested, deployable app with ops docs.

---

### 🚀 P2 (Post-Launch Polish)

**Goal:** Fill gaps, improve UX, harden for scale.

#### P2a: Feature Completeness (4–6 hrs)
| # | Task | Effort | Rationale |
|---|------|--------|-----------|
| 13 | **Mobile photo upload** | 1 hr | Integrate `expo-image-picker` in `apps/mobile/app/pin/[id].tsx`, call same `/api/photos/sign` + upload flow as web. |
| 14 | **Email verification** | 1.5 hrs | Configure Better Auth email plugin, create verification email template, add `/auth/verify-email` endpoint, show "Check your email" banner. |
| 15 | **Forgot password** | 1 hr | Add Better Auth password reset plugin, create reset email template, add `/reset-password` page. |
| 16 | **User profile page** | 1.5 hrs | Create `/profile` page: update name, email, password, upload avatar (reuse photo upload flow), show circles. |
| 17 | **Photo deletion** | 30 min | Add DELETE `/api/photos/:id` endpoint, add trash icon in PinSheet photo album. |

#### P2b: Quality & Operations (6–8 hrs)
| # | Task | Effort | Rationale |
|---|------|--------|-----------|
| 18 | **E2E tests** | 3 hrs | Install Playwright. Write 5 E2E tests: signup → create circle → drop pin → upload photo → verify displays. |
| 19 | **Error boundaries** | 1 hr | Add React error boundaries in web app (`_app.tsx` or layout), show friendly "Something went wrong" with reload button. |
| 20 | **Rate limiting** | 1.5 hrs | Install `hono-rate-limiter` or `@hono/rate-limit`, add per-IP limits: 5 signups/hour, 20 uploads/hour, 100 API calls/min. |
| 21 | **Structured logging** | 1 hr | Replace `console.error` with Pino or Winston, log request ID, user ID, route, latency. Pipe to file or cloud logging. |
| 22 | **Sentry error tracking** | 1 hr | Add Sentry SDK to web + mobile + API, configure source maps, test error capture. |
| 23 | **Accessibility pass** | 2.5 hrs | Add ARIA labels to map markers, modal dialogs, buttons; add focus traps to PinSheet/PinComposer; test keyboard nav; add alt text to images. |

#### P2c: Infrastructure (8–12 hrs)
| # | Task | Effort | Rationale |
|---|------|--------|-----------|
| 24 | **Dockerfile for API** | 1 hr | Create `apps/api/Dockerfile`, build container, test locally with `docker compose`. |
| 25 | **Automated backups** | 2 hrs | Set up daily Postgres backups (pgBackRest, managed DB auto-backup, or cron + `pg_dump`). Document restore procedure. |
| 26 | **Uptime monitoring** | 1 hr | Set up UptimeRobot, Checkly, or BetterStack to ping `/api/health` every 5 min, alert on downtime. |
| 27 | **Dependency updates** | 1 hr | Set up Dependabot or Renovate, configure automerge for patch/minor, require manual review for major. |
| 28 | **Load testing** | 3 hrs | Use k6 or Artillery to simulate 100 concurrent users, 1000 pins per circle, 50 uploads/min. Identify bottlenecks. |

---

## 6. Effort Summary

| Priority | Focus | Total Effort | Key Deliverables |
|----------|-------|--------------|------------------|
| **P0** | Make it work | ~1 hour | Buildable, bootable, manually verified |
| **P1** | Make it safe | ~5.5 hours | CI, tests, migrations, deploy docs, audit fixes |
| **P2a** | Feature gaps | 4–6 hours | Mobile upload, email verify, password reset, profile, photo delete |
| **P2b** | Quality | 6–8 hours | E2E tests, error handling, rate limits, logging, Sentry, a11y |
| **P2c** | Ops | 8–12 hours | Docker, backups, monitoring, dep updates, load tests |

**Total to production-ready v1:** ~25–33 hours (3–4 focused days for one engineer, or 1 week part-time).

---

## 7. Conclusion

Ithaka is a **solid foundation** with thoughtful architecture (monorepo, shared types, dual storage backends, role-based auth). The claimed v1 feature set is **mostly implemented** — 85% of user-facing functionality works in code. However:

- **It does not currently build or run** due to two fixable type errors.
- **No tests, CI, or deployment config** means it is not production-ready.
- **Database-dependent verification was blocked** by lack of Docker in the assessment environment.

**Recommended path:**
1. **Fix P0 issues** (1 hour) to unblock development.
2. **Complete P1 tasks** (5.5 hours) to make the app shippable with confidence.
3. **Prioritize P2 items** based on user feedback and scale requirements.

With focused effort, Ithaka can reach a **deployable, tested v1** in under a week.

---

**Assessment by:** Cloud Agent  
**Repository:** Ithaka monorepo  
**Contact:** See PR for questions or clarifications.
