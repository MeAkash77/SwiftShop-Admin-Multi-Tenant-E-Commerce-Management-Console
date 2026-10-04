# Deployment Guide — MultiCommerce on Vercel

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://multicommerce-web.vercel.app |
| Backend API | https://multicommerce-api.vercel.app/api |
| Health | https://multicommerce-api.vercel.app/health |

Vercel projects: `multicommerce-web` (root `frontend/`), `multicommerce-api` (root `backend/`).

---

## Env wiring (production)

| Project | Variable | Value |
|---------|----------|-------|
| Frontend | `VITE_API_URL` | `https://multicommerce-api.vercel.app/api` |
| Backend | `CLIENT_URL` | `https://multicommerce-web.vercel.app` |

Also required on backend: `MONGODB_URL`, `JWT_*`, email, Cloudinary, Razorpay, `ADMIN_SETUP_SECRET`, `NODE_ENV=production`.

---

## MongoDB Atlas (required for Vercel)

If you see `users.findOne() buffering timed out`:

1. Atlas → **Network Access** → add `0.0.0.0/0` (allow from anywhere; needed for Vercel serverless IPs).
2. Confirm `MONGODB_URL` is set on the **multicommerce-api** Vercel project (production).
3. Redeploy the API after changing Network Access or env vars.

The API now awaits MongoDB on each `/api` request (serverless-safe cached connection).

---

## Redeploy

```bash
cd backend && npx vercel --prod
cd frontend && npx vercel --prod
```

After changing `VITE_API_URL`, always redeploy the **frontend** (Vite bakes env at build time).  
After changing `CLIENT_URL`, redeploy the **backend** (CORS + password-reset links).

---

## First Super Admin

1. Open https://multicommerce-web.vercel.app/admin/setup  
2. Use the `ADMIN_SETUP_SECRET` set on the backend  
3. Sign in at `/admin/login`

---

## Cross-origin auth notes

- Access JWT via `Authorization: Bearer` (works across domains).
- Refresh cookie uses `SameSite=None; Secure` on Vercel.
- CORS allows `CLIENT_URL` (comma-separated list supported).

---

*See also: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md), [DOCUMENTATION.md](./DOCUMENTATION.md), [CI/CD](./.github/CI_CD.md)*
