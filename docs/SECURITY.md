# Security Vulnerabilities Status

## Addressed (Fixed)

### Critical
- ✅ **maplibre-gl XSS** (GHSA-jrc7-96c5-q579) - Updated from 5.7.0 to 6.9.0

### High  
- ✅ **drizzle-orm SQL injection** (GHSA-gpj5-g38j-94v9) - Updated from 0.44.5 to 0.45.2

## Deferred (Require Breaking Changes)

### High Severity
- ⚠️ **Next.js vulnerabilities** (DoS, Source Code Exposure) - Already on 15.6.0-canary.57 which includes fixes, but npm audit suggests newer canary versions. Stable release upgrade recommended when Next.js 16 is released.
- ⚠️ **PostCSS XSS vulnerabilities** (GHSA-qx2v-qp2m-jg93, etc.) - Transitive dependency of Next.js. Fixed in Next.js 16.
- ⚠️ **sharp/libvips vulnerabilities** (CVE-2026-33327, etc.) - Transitive dependency of Next.js. Fixed in Next.js 16.
- ⚠️ **image-size DoS** (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq) - Affects React Native/Metro. Would require React Native 0.86+ upgrade (breaking change for mobile app).

### Moderate Severity
- ⚠️ **decode-uri-component DoS** - Affects expo-router. Would require major expo-router upgrade.
- ⚠️ **esbuild dev server vulnerability** - Affects drizzle-kit (dev dependency). Low risk as it only affects local development.

## Summary
- **Before fixes:** 33 vulnerabilities (1 critical, 8 high, 24 moderate)
- **After fixes:** 32 vulnerabilities (0 critical, 9 high, 23 moderate)
- **Removed:** 1 critical, 1 high from the immediately addressable set

## Recommendations
1. ✅ **Done**: Update drizzle-orm and maplibre-gl to fix critical/high vulnerabilities
2. 📅 **Next iteration**: Upgrade to Next.js 16 stable when released (will fix PostCSS, sharp, Next.js vulnerabilities)
3. 📅 **Mobile app iteration**: Upgrade React Native to 0.86+ and expo-router to latest
4. ℹ️ **Low priority**: Update drizzle-kit when @esbuild-kit dependencies are removed upstream

## Testing
All changes tested:
- ✅ npm install succeeds
- ✅ npm run build succeeds  
- ✅ npm test passes
- ✅ Type checking passes
