# Scale MultiCommerce to ~5000 concurrent shoppers

## Why free Vercel alone is not enough

Load tests against serverless API showed **~25–50 comfortable**, **~100 max with lag**.  
**~5000 concurrent** needs warm containers, Redis cache hits, paginated catalog APIs, and a stronger Mongo tier.

**Single-user lag (~600ms+)** on Vercel usually means Redis was `skipped` and every request hit Atlas. The API now keeps an **in-memory TTL cache** on warm instances and sets **CDN Cache-Control** (`s-maxage`) so repeat product list/search can land under **~300ms** without Redis. For stable multi-user &lt;300ms, still run Docker + Redis.

```text
Users → Frontend CDN (Vercel ok)
     → API replicas (Docker / Railway / VPS)
          → Redis (hot list/search)
          → MongoDB Atlas (M10+ recommended)
```

## What we shipped in code

| Piece | Purpose |
|-------|---------|
| Redis (`REDIS_URL`) + **in-memory TTL** | Cache product list/search/detail + categories |
| GitHub **Keep API warm** cron (every 5 min) | Reduce 2–3s first-visit cold starts on Vercel |
| Frontend **shop bootstrap cache** | Instant paint on reload from localStorage while APIs refresh |
| Pagination `page`/`limit` | Stop returning the full catalog every request |
| Mongo indexes + text search | Faster find/filter under load |
| Lean list payloads | Smaller JSON for card grids |
| `compression` + soft rate limit | Less bandwidth; protect from scrapers |
| `docker compose` | API + Redis always-on stack |

Without `REDIS_URL`, the API still works (cache skipped).

## Local: Docker Compose

1. Copy [`.env.example`](../.env.example) → `.env` and set `MONGODB_URL` (Atlas).
2. From repo root:

```bash
docker compose up --build
```

3. Check:

```bash
curl http://localhost:3000/health
# expect: "db":"connected", "redis":"connected"
```

4. Point frontend `.env` to the API:

```env
VITE_API_URL=http://localhost:3000/api
```

5. Verify cache: call products twice and compare `X-Cache: MISS` then `HIT`:

```bash
curl -sI "http://localhost:3000/api/product?status=active&page=1&limit=12"
```

## Production checklist (toward 5000)

1. **Host API as containers** (Railway / Render / Fly / VPS) — not free serverless.
2. Run **2–4 API replicas** behind a load balancer; shared Redis.
3. Redis: Docker service or managed Redis (Upstash / Redis Cloud).
4. Atlas: region near API; upgrade past M0; keep indexes from `productModel`.
5. Frontend can stay on Vercel CDN; set `VITE_API_URL` to the container API.
6. Optional Upstash on Vercel first (helps a lot for browse) before full migrate.

## Load-test guidance

Warm the API, then ramp concurrent `GET /api/product?status=active&page=1&limit=12`:

| Step | Concurrent | Target |
|------|------------|--------|
| Warm | 50 | p95 &lt; 1s with Redis HIT |
| Crowd | 500 | p95 &lt; 1.5s |
| Peak | 2000–5000 | p95 &lt; 2s on cached pages; scale replicas if not |

Product **writes** (cart/checkout) are heavier; browse scale comes first from Redis + pagination.

## Env vars

| Var | Notes |
|-----|--------|
| `REDIS_URL` | `redis://redis:6379` in Compose; Upstash `rediss://…` |
| `MONGO_MAX_POOL` | ~20 for Docker; keep low (~5) on serverless |
| `MONGODB_URL` | Atlas connection string |

## Honest limit

5000 **simultaneous browser sessions** browsing cached pages is reachable with replicas + Redis + Atlas.  
5000 **checkout transactions per second** is a different class of system (queues, payment concurrency) and is out of scope for this pass.
