# MultiCommerce — Multi-Tenant E-Commerce Platform

**MultiCommerce** is a full-stack multi-tenant marketplace. Vendors run their own stores, customers shop and checkout (Razorpay or COD), and Super Admins oversee the platform — all in one product.

---

## 1. Live Demo

| | URL |
|---|-----|
| **Web App** | https://multicommerce-web.vercel.app |
| **API** | https://multicommerce-api.vercel.app/api |
| **Health** | https://multicommerce-api.vercel.app/health |

| Role | Entry |
|------|--------|
| Shop (customer) | [/customer](https://multicommerce-web.vercel.app/customer) |
| Customer login | [/login](https://multicommerce-web.vercel.app/login) |
| Vendor portal | [/vendor/login](https://multicommerce-web.vercel.app/vendor/login) |
| Admin portal | [/admin/login](https://multicommerce-web.vercel.app/admin/login) |

---

## 2. Who it’s for

| Role | What they do |
|------|----------------|
| **Customer** | Browse catalogs, cart & wishlist, checkout (Razorpay / COD), track orders |
| **Vendor** | Register a store, list products, manage stock, fulfill orders, coupons & marketing |
| **Super Admin** | Users, stores, catalog oversight, sales, inventory, payments, analytics |

**Why MultiCommerce:** local / multi-vendor sellers get an online storefront without building a separate site.

---

## 3. Core features (by role)

### Authentication
- Customer: `/register`, `/login` + email OTP  
- Vendor: `/vendor/register`, `/vendor/login` · API `/api/vendor/auth`  
- Admin: `/admin/login`, `/admin/setup` · API `/api/admin/auth`  
- JWT access + httpOnly refresh cookie; forgot / reset / change password per portal  

### Customer (`/customer`)
- Public browse; login required to buy  
- Coupons, store shipping fees, Razorpay or COD  
- Orders, payments, account (reviews, wishlist, updates)  

### Vendor (`/vendor`)
- Store profile, shipping & returns  
- Products (variants, Cloudinary, bulk import), inventory, low-stock alerts  
- **Add from master catalog** — browse admin-curated brands/models and auto-fill a listing, then set price/stock and publish  
- Orders & payment status, coupons, home marketing, support chat, reviews, payouts  

> **Vendor docs:** [planning](./docs/vendor/README.md) · [Shopify-plain UI](./docs/vendor/UI-UX-SHOPIFY-PLAIN.md)

### Admin (`/admin`)
- Dashboard + charts  
- **Master catalog** — curate brands, models, specs & suggested pricing that vendors reuse  
- Users, stores, products, orders, inventory, sales, customers, payments, payouts, reports, settings  

---

## 4. Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, Redux Toolkit, React Router, Recharts, Tailwind CSS |
| Backend | Node.js, Express, MongoDB/Mongoose, Helmet, JWT, Bcrypt |
| Auth | JWT + httpOnly refresh cookie + email OTP |
| Payments | Razorpay + COD |
| Media / Email | Cloudinary, Nodemailer |

**Local:** API `http://localhost:3000/api` · App `http://localhost:5173` (or `npm run dev:all` → customer `:5173`, vendor `:5174`, admin `:5175`) · Health `http://localhost:3000/health`

**Production (Vercel):**
- Frontend `VITE_API_URL=https://multicommerce-api.vercel.app/api`
- Backend `CLIENT_URL=https://multicommerce-web.vercel.app`
- Optional JWT: `JWT_ACCESS_EXPIRES=1h`, `JWT_REFRESH_EXPIRES=30d`

**Production multi-portal (open each portal on its own URL):**
The same build serves all three portals. Pick one:
- **Subdomains (one deployment):** point `customer.`, `vendor.`, `admin.` at the
  same frontend deployment — `/` auto-opens the matching portal. Add each host to
  backend `CLIENT_URL` (comma-separated).
- **Separate deployments:** deploy the frontend 3× with `VITE_PORTAL=customer` /
  `vendor` / `admin`. Each site's `/` opens only that portal.
- Full app (all portals under one host via `/customer`, `/vendor`, `/admin`) still
  works when `VITE_PORTAL` is unset and no portal subdomain is used.

---

## 5. Quick start

```bash
# Backend
cd backend
cp .env.example .env   # MongoDB, JWT, Email, Cloudinary, Razorpay
npm install
npm run dev            # :3000
# Dev-only (blocked in production unless ALLOW_SEED=1):
# npm run seed:demo
# npm run seed:catalog     # sample vendor products
# npm run seed:master      # master catalog (brands → models/specs)
# npm test

# Frontend
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev            # :5173

# All three portals at once (separate tabs, separate logins per port)
npm run dev:all        # customer :5173 · vendor :5174 · admin :5175
# Or one portal only:
# npm run dev:customer
# npm run dev:vendor
# npm run dev:admin
```

### First run (happy path)
1. Vendor register → OTP → create store → add products  
2. Guest browses → customer login → checkout  
3. Vendor updates order status  
4. Admin opens analytics  

---

## 6. Order status flow

```
Pending → Confirmed → Processing → Shipped → Delivered
   ↓           ↓                        ↓
Cancelled   Cancelled                Returned
```

---

## 7. API snapshot

| Area | Base |
|------|------|
| Auth (customer) | `/api/auth` |
| Vendor auth | `/api/vendor/auth` |
| Admin auth | `/api/admin/auth` |
| Users | `/api/user` |
| Stores | `/api/store` |
| Products | `/api/product` |
| Orders + Razorpay | `/api/order` |
| Dashboard | `/api/dashboard` |
| Categories | `/api/category` |

Full tables: [DOCUMENTATION.md](./DOCUMENTATION.md)

---

## 8. Documentation

| Start here | |
|------------|--|
| **[docs/README.md](./docs/README.md)** | Full docs index |
| **[docs/vendor/](./docs/vendor/README.md)** | Vendor services catalog & planning |
| [User guidelines](./docs/06-USER-GUIDELINES.md) | How-to for all roles |
| [Customer](./docs/user-guides/CUSTOMER.md) · [Vendor](./docs/user-guides/VENDOR.md) · [Admin](./docs/user-guides/ADMIN.md) | Role guides |
| [01 System design](./docs/01-SYSTEM-DESIGN.md) | Architecture & tenancy |
| [02 Project flow](./docs/02-PROJECT-FLOW.md) | Auth → checkout → invoice |
| [03 Database](./docs/03-DATABASE-MODULES.md) · [04 API](./docs/04-API-MODULES.md) · [05 Frontend](./docs/05-FRONTEND-ARCHITECTURE.md) | Modules |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Local setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md) · [CI/CD](./.github/CI_CD.md) | Ship & pipeline |
| [07 Performance](./docs/07-PERFORMANCE-VERCEL.md) · [10 Scale](./docs/10-SCALE-5000-USERS.md) · [11 Capacity](./docs/11-LIVE-API-RESPONSE-AND-CAPACITY.md) | Speed & scale |

---

*MultiCommerce* · Live: [multicommerce-web.vercel.app](https://multicommerce-web.vercel.app)
