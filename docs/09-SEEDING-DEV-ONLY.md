# Catalog & demo seeding (development)

Seed scripts live under `backend/scripts/` and are **developer tools**, not part of the Vercel app build or CD pipeline.

| Script | Command | Purpose |
|--------|---------|---------|
| Demo accounts | `npm run seed:demo` | Admin / vendor / customer + sample store |
| Rich catalog | `npm run seed:catalog` | ~100 products, categories, photo reviews |
| Fix broken images | `npm run seed:fix-images` | Repair known-bad Unsplash URLs on catalog SKUs |

## Safety

- Local development: seeds run normally (`NODE_ENV` not production, no `VERCEL=1`).
- Production / Vercel-like env: **blocked** unless you set `ALLOW_SEED=1`.
- Never add `seed:*` to GitHub Actions deploy jobs.

Intentional production seed (rare — prefers running against a staging DB first):

```bash
cd backend
ALLOW_SEED=1 SEED_TARGET=production npm run seed:catalog
```

App features (coupons, chat, UX) ship via normal deploy. Catalog **content** is data in MongoDB — seed only when you need to refresh demo inventory.
