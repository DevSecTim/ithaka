# Ithaka

A shared travel map and scrapbook for a **circle** — a household, two friends, a class trip. Wishlist pins are dreams. Visited pins open a scrapbook.

Say **ITH-uh-kuh**. The Cavafy spelling, not Ithaca.

## What’s in v1

- Sign up / sign in (email + password)
- Create a circle or join with an invite link
- Belong to more than one circle; switching circles switches the map
- Roles: organizer, member, child
- Full-bleed map: search a place or click / long-press to drop a pin
- Wishlist vs visited, destination sheet, “I want to go”, convert to visited
- Photos on a trip (cover + a small album, 12 max)
- Journal strip, searchable list view (keyboard / screen-reader path)
- Web (Next.js) and iOS/Android (Expo) against one Hono API

No booking, no public profiles, no live location.

## Stack

| Piece | Choice |
| --- | --- |
| Monorepo | Turborepo · npm workspaces |
| Web | Next.js App Router |
| Mobile | Expo + Expo Router |
| API | Hono (`packages/api`, also served from `apps/api`) |
| DB | Postgres + Drizzle |
| Auth | Better Auth |
| Maps | MapLibre / OpenFreeMap (Mapbox if you set a token) |
| Photos | Local disk, or Cloudflare R2 when configured |

## Run it

You need Node 20+ and Docker.

```bash
cp .env.example .env
# set BETTER_AUTH_SECRET to a long random string:
#   openssl rand -base64 32

docker compose up -d
npm install
npm run db:migrate
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). The web app mounts the API at `/api`. The standalone API (for Expo) is [http://localhost:3001](http://localhost:3001) when `apps/api` is running.

> **Note**: The project now uses Drizzle migrations for production-safe schema management. After schema changes, run `npm run db:generate` to create a migration. For development-only schema syncing, you can use `npm run db:push` (not recommended for production).

```bash
npm run dev          # web + api
npm run dev:mobile   # Expo + api
```

On a physical phone, set `EXPO_PUBLIC_API_URL` to your machine’s LAN address, not localhost.

## Optional

- **Mapbox** — set `MAPBOX_TOKEN` and `NEXT_PUBLIC_MAPBOX_TOKEN` for Mapbox geocoding and the light style. Without them, Ithaka uses Nominatim and OpenFreeMap.
- **Cloudflare R2** — set the `R2_*` variables for signed photo uploads. Without them, photos land in `data/uploads`.

## Repo

```
apps/web        Next.js marketing site + map
apps/mobile     Expo
apps/api        Hono server for mobile
packages/api    Shared Hono app
packages/db     Drizzle schema
packages/shared Zod contracts and roles
```
