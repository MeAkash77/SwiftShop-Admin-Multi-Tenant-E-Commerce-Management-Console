# CI/CD — GitHub Actions + Vercel

## Pipelines

| Workflow | File | When | What |
|----------|------|------|------|
| **CI** | `.github/workflows/ci.yml` | Push / PR to `main` | Frontend build + backend syntax + smoke tests |
| **CD** | `.github/workflows/cd.yml` | Push to `main` (or manual) | Deploy API + Web to Vercel, then smoke test |

Live:
- Web: https://multicommerce-web.vercel.app
- API: https://multicommerce-api.vercel.app

---

## Required GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | Create at https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `team_F0Oqc54KDoexN9liLItegdMP` |
| `VERCEL_PROJECT_ID_API` | `prj_LWBtiUUG7LcZy0RctUFsq0Z7PHry` (multicommerce-api) |
| `VERCEL_PROJECT_ID_WEB` | `prj_GffFvOTEGK7vcQLEC4nZTi4cAfxZ` (multicommerce-web) |

App env vars (MongoDB, JWT, etc.) stay in the **Vercel project** dashboards — CD does not overwrite them.

---

## Flow

```
push / PR → CI (frontend build, backend check)
     │
     └─ push to main → CD
           ├─ gate builds
           ├─ vercel deploy API (prod)
           ├─ vercel deploy Web (prod)
           └─ smoke: /health + web HTTP 200
```

Manual deploy: GitHub → Actions → **CD — Deploy to Vercel** → Run workflow.

---

## Optional: GitHub Environments

CD references environments `production-api` and `production-web` (for deployment URLs in the Actions UI). Create them under **Settings → Environments** if prompted; no protection rules required for first use.

---

*See also: [DEPLOYMENT.md](./DEPLOYMENT.md)*
