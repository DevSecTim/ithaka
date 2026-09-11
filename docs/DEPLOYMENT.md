# Deployment Guide

This guide covers deploying Ithaka to production. The monorepo contains:
- **Web app** (`apps/web`) — Next.js App Router
- **API server** (`apps/api`) — Hono API for mobile clients  
- **Mobile app** (`apps/mobile`) — Expo for iOS/Android
- **Database** — PostgreSQL

---

## Prerequisites

- Node.js 20+
- PostgreSQL database (managed or self-hosted)
- Git repository access
- Domain name (optional, but recommended)

---

## Deployment Options

### Option 1: Vercel (Recommended for Web + API)

Vercel can host both the Next.js web app and the API server.

#### 1. Prepare Your Database

Provision a PostgreSQL database from:
- [Railway](https://railway.app/) (easy, generous free tier)
- [Supabase](https://supabase.com/) (PostgreSQL + extras)
- [Neon](https://neon.tech/) (serverless Postgres)
- [Render](https://render.com/) (fully managed)

Note your `DATABASE_URL` (format: `postgres://user:password@host:5432/dbname`).

#### 2. Run Database Migrations

From your local machine (with access to the production database):

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgres://..."

# Run migrations
npm run db:migrate
```

#### 3. Deploy Web App to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build --workspace=@ithaka/web`
   - **Install Command:** `npm install`

5. Set Environment Variables:
   ```
   DATABASE_URL=postgres://...
   BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
   BETTER_AUTH_URL=https://your-domain.vercel.app
   WEB_URL=https://your-domain.vercel.app
   
   # Optional:
   MAPBOX_TOKEN=...
   NEXT_PUBLIC_MAPBOX_TOKEN=...
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=...
   R2_PUBLIC_URL=...
   ```

6. Deploy!

#### 4. Deploy Standalone API (for Mobile)

If you need a separate API server for mobile clients:

1. In Vercel, create a new project
2. Import the same repository
3. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm run build --workspace=@ithaka/api-server`
   - **Install Command:** `npm install`
   - **Output Directory:** (leave blank)

4. Set the same environment variables as above, plus:
   ```
   API_PORT=3001
   ```

5. Deploy!

---

### Option 2: Railway (Monorepo-Friendly)

Railway can deploy all services from one repo.

#### 1. Set Up Project

1. Go to [railway.app](https://railway.app/)
2. Create a new project
3. Provision a PostgreSQL database (Railway provides this)
4. Note your `DATABASE_URL` from the Postgres service

#### 2. Run Migrations

```bash
export DATABASE_URL="<from Railway Postgres>"
npm run db:migrate
```

#### 3. Deploy Web App

1. Add a service → GitHub Repo
2. Select your repository
3. Configure:
   - **Root Directory:** `apps/web`
   - **Start Command:** `npm run start --workspace=@ithaka/web`
   - **Build Command:** `npm install && npm run build --workspace=@ithaka/web`
4. Add environment variables (same as Vercel list above)
5. Deploy and note the generated URL

#### 4. Deploy API (Optional)

Repeat for `apps/api`:
- **Root Directory:** `apps/api`
- **Start Command:** `npm run start --workspace=@ithaka/api-server`
- Add `API_PORT=3001` variable

---

### Option 3: Self-Hosted (Docker)

For full control, deploy on your own server.

#### 1. Build Docker Images

**Web App Dockerfile** (`apps/web/Dockerfile`):

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build --workspace=@ithaka/web

# Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

CMD ["npm", "run", "start", "--workspace=@ithaka/web"]
EXPOSE 3000
```

**API Dockerfile** (`apps/api/Dockerfile`):

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/
RUN npm ci

COPY . .
RUN npm run build --workspace=@ithaka/api-server

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app /app
CMD ["npm", "run", "start", "--workspace=@ithaka/api-server"]
EXPOSE 3001
```

#### 2. Docker Compose for Production

**docker-compose.prod.yml**:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ithaka
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ithaka
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      DATABASE_URL: postgres://ithaka:${DB_PASSWORD}@postgres:5432/ithaka
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${WEB_URL}
      WEB_URL: ${WEB_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgres://ithaka:${DB_PASSWORD}@postgres:5432/ithaka
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${WEB_URL}
      WEB_URL: ${WEB_URL}
      API_PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy

```bash
# Set environment variables
export DB_PASSWORD="..."
export BETTER_AUTH_SECRET="..."
export WEB_URL="https://your-domain.com"

# Run migrations
npm run db:migrate

# Start services
docker compose -f docker-compose.prod.yml up -d
```

#### 4. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Set up SSL with:
```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## Mobile App Deployment

### TestFlight / Internal Testing

1. Build for iOS:
   ```bash
   cd apps/mobile
   eas build --platform ios
   ```

2. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```

### Google Play Internal Testing

1. Build for Android:
   ```bash
   cd apps/mobile
   eas build --platform android
   ```

2. Submit to Play Console:
   ```bash
   eas submit --platform android
   ```

### Environment Configuration

Update `apps/mobile/app.json` for production:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.ithaka"
    },
    "android": {
      "package": "com.yourcompany.ithaka"
    }
  }
}
```

Set production API URL in `.env.production`:
```
EXPO_PUBLIC_API_URL=https://api.your-domain.com
```

---

## Post-Deployment Checklist

### Security
- [ ] `BETTER_AUTH_SECRET` is a strong random string (32+ characters)
- [ ] Database credentials are secure and not in version control
- [ ] HTTPS is enabled (via Vercel, Cloudflare, or Let's Encrypt)
- [ ] R2 bucket is properly configured with CORS (if using)

### Performance
- [ ] Database has proper indexes (Drizzle migrations include these)
- [ ] API response times are < 500ms for most endpoints
- [ ] Images are properly sized (Next.js Image Optimization handles this)

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Monitor database connection pool usage
- [ ] Set up uptime monitoring (UptimeRobot, BetterStack, etc.)

### Backups
- [ ] Automated daily database backups enabled
- [ ] Backup restoration tested at least once
- [ ] Photo storage backup strategy in place (if using R2)

---

## Environment Variables Reference

### Required
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Random 32+ character string for session encryption
- `BETTER_AUTH_URL` — Your web app's public URL
- `WEB_URL` — Your web app's public URL (same as BETTER_AUTH_URL typically)

### Optional
- `API_PORT` — Port for standalone API server (default: 3001)
- `MAPBOX_TOKEN` — Mapbox API token for geocoding and map styles
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox token exposed to client
- `EXPO_PUBLIC_MAPBOX_TOKEN` — Mapbox token for mobile
- `R2_ACCOUNT_ID` — Cloudflare R2 account ID for photo storage
- `R2_ACCESS_KEY_ID` — R2 access key
- `R2_SECRET_ACCESS_KEY` — R2 secret key  
- `R2_BUCKET` — R2 bucket name
- `R2_PUBLIC_URL` — Public URL for R2 bucket (e.g., via custom domain)
- `EXPO_PUBLIC_API_URL` — API endpoint for mobile app (e.g., `https://api.your-domain.com`)

---

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check database server is accessible from your deployment environment
- Ensure database accepts connections from your hosting provider's IPs

### "BETTER_AUTH_SECRET is not set"
- Add `BETTER_AUTH_SECRET` to environment variables
- Generate one: `openssl rand -base64 32`
- Restart the application

### "Type errors during build"
- Run `npm run lint` locally to catch TypeScript errors
- Ensure all dependencies are installed: `npm install`
- Check CI logs for detailed error messages

### Mobile app can't connect to API
- Verify `EXPO_PUBLIC_API_URL` is set to your production API URL
- Check CORS configuration in `packages/api/src/app.ts`
- Ensure API is accessible over HTTPS

---

## CI/CD Integration

The included `.github/workflows/ci.yml` runs on every push and PR:
- ✅ Lints all packages
- ✅ Runs tests
- ✅ Builds web app
- ✅ Verifies type safety

For automatic deployment:
- **Vercel**: Enable "Deploy on Push" in project settings
- **Railway**: Enable "Deploy on Push" for each service
- **Self-hosted**: Add deployment step to CI workflow

---

## Scaling Considerations

### Database
- Start with connection pooling (Drizzle already uses this)
- Add read replicas when queries exceed 100 qps
- Consider PgBouncer for connection pooling at scale

### API
- Horizontal scaling: Deploy multiple API instances behind a load balancer
- Cache frequent queries (e.g., circles list) with Redis
- Rate limit auth endpoints to prevent abuse

### Photos
- Use Cloudflare R2 for scalable, cost-effective storage
- Enable CDN caching for photo URLs
- Implement image resizing at upload time (not on-demand)

---

## Support

For issues or questions:
- Check the [main README](../README.md) for local development setup
- Review [SECURITY.md](./SECURITY.md) for vulnerability status
- Open an issue in the GitHub repository

---

## License

See [LICENSE](../LICENSE) in the repository root.
