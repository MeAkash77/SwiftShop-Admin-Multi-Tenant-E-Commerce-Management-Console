# Make MultiCommerce faster on free Vercel

Your app feels slow mainly because of **(1) a huge JS download** and **(2) API cold starts** on the free plan. This guide lists what we changed in code and what you can do in Vercel / Atlas.

---

## What we optimized in code

| Change | Benefit |
|--------|---------|
| **Lazy-loaded routes** (`App.jsx`) | First visit only loads the page you open, not admin+vendor+shop together |
| **Vite `manualChunks`** | React / charts / editor / icons split into cacheable files |
| **Long-cache headers** (`frontend/vercel.json`) | Returning visitors reuse JS/CSS from browser cache |
| **preconnect** to API + Cloudinary | Faster first API/image connection |
| **Smaller Mongo pool on Vercel** | Less overhead on serverless functions |

Redeploy frontend (+ backend if DB change matters) after these updates.

---

## Why free Vercel is slow

1. **Serverless cold start** — After idle minutes, the first API request can take 2–8+ seconds while Node + Mongo wake up.  
2. **MongoDB Atlas** — From Vercel’s region to Atlas adds latency; IP allowlist `0.0.0.0/0` is required.  
3. **Big assets** — Font Awesome + Recharts + TipTap are heavy if loaded up front (now split / lazy).  

Free tier **cannot keep a server warm forever**. Paid Hobby/Pro “Fluid” or a tiny always-on API host is the hard fix for cold starts.

---

## Quick wins you can do now (no paid plan)

### 1. Redeploy web + API
Deploy latest frontend (and backend) to production so lazy loading and cache headers go live.

### 2. Keep API warmer (optional free trick)
Use a free cron ([cron-job.org](https://cron-job.org) or GitHub Actions schedule) to hit every ~10–14 minutes:

```text
GET https://multicommerce-api.vercel.app/health
```

This reduces cold starts. Vercel free still sleeps sometimes; this only helps.

### 3. MongoDB Atlas
- Cluster region close to Vercel (**Washington / US East** if API is `iad1`)  
- Network Access: allow `0.0.0.0/0` for Vercel  
- Avoid free M0 if you can upgrade later — M0 is slow under load  

### 4. Cloudinary images
Use transformed URLs (smaller width/quality), e.g. `w_400,q_auto,f_auto` in delivery URLs so the shop loads thumbnails faster.

### 5. Browser check
Hard refresh once after deploy (`Ctrl+Shift+R`). Then reload again — cached assets should feel much snappier.

---

## If you can spend a little

| Option | Effect |
|--------|--------|
| Vercel Pro / always-warm | Far fewer API cold starts |
| Host API on Railway / Render free-ish always-on | Stable API latency |
| Move Atlas nearer + paid tier | Faster DB queries |
| Replace full Font Awesome with SVG subset | Smaller CSS/fonts |

---

## How to measure

1. Chrome DevTools → **Network** → disable cache → reload home. Note JS size and wait time.  
2. After deploy with lazy routes, homepage JS should be **much smaller** than the old ~1.3 MB single bundle.  
3. Call `/health` twice: first = cold, second = warm.

---

## Related docs

- [Deployment](../DEPLOYMENT.md)  
- [User guidelines](./06-USER-GUIDELINES.md)  
