# MultiCommerce — Project Documentation

Multi-Tenant E-Commerce Platform (SaaS) for independent vendors to register, create storefronts, manage inventory, and sell within one unified marketplace.

**Live app:** https://multicommerce-web.vercel.app · **API:** https://multicommerce-api.vercel.app/api · **Health:** https://multicommerce-api.vercel.app/health

**For developers joining the repo:** start with **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** (portals, request flow, where to edit). This file focuses on features, APIs, and setup. Deploy notes: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

### System design docs (`docs/`)

| Doc | Content |
|-----|---------|
| [docs/README.md](./docs/README.md) | Index |
| [01 — System Design](./docs/01-SYSTEM-DESIGN.md) | Architecture, roles, tenancy, security |
| [02 — Project Flow](./docs/02-PROJECT-FLOW.md) | Auth, cart, checkout, payments, invoice |
| [03 — Database Modules](./docs/03-DATABASE-MODULES.md) | Collections, fields, ER relationships |
| [04 — API Modules](./docs/04-API-MODULES.md) | Backend folders, routes, middleware |
| [05 — Frontend Architecture](./docs/05-FRONTEND-ARCHITECTURE.md) | React structure, Redux, layouts |

---

## 1. Project Summary

| Item | Detail |
|------|--------|
| Name | MultiCommerce |
| Type | Multi-tenant e-commerce SaaS |
| Roles | `superAdmin`, `vendor`, `customer` |
| Frontend | React, Redux Toolkit, React Router, Tailwind (available), Flipkart-style shop UI |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose (tenant isolation via store/vendor ownership) |
| Payments | Razorpay (UPI / Card / NetBanking / Wallet) + COD |
| Media | Cloudinary + Multer |
| Email | Nodemailer (OTP, password reset, order + payment emails) |
| Security | JWT, Bcrypt.js, Helmet.js, RBAC middleware |

**Expected impact:** Local businesses get an online storefront without building a standalone site. Super Admins oversee the platform; vendors run retail operations independently.

---

## 2. Architecture

```
┌─────────────────┐     JWT + Cookies      ┌──────────────────┐
│  React Frontend │ ◄────────────────────► │  Express API     │
│  /customer      │     /api/*             │  /api/auth       │
│  /vendor        │                        │  /api/store      │
│  /admin         │                        │  /api/product    │
└─────────────────┘                        │  /api/order      │
                                           │  /api/dashboard  │
                                           └────────┬─────────┘
                                                    │
                     ┌──────────────────────────────┼──────────────────────────────┐
                     ▼                              ▼                              ▼
                MongoDB                        Cloudinary                      Razorpay
             (Users/Stores/                 (product images)                (checkout)
              Products/Orders)                                              Nodemailer
                                                                            (transactional)
```

### Tenant isolation
- Each **vendor** owns one **store** (`vendorId` unique on Store).
- Products are scoped by `vendor` + `store`.
- Orders are scoped by `storeId` / `customerId`.
- Vendors can only manage their own store orders and payments.
- Customers only see their own orders/payments after login.

---

## 3. Roles & Access

| Role | Login landing | Capabilities |
|------|---------------|--------------|
| Guest | `/customer` | Browse products & details only |
| Customer | `/customer` | Cart, checkout, orders, payments, account |
| Vendor | `/vendor` | Store, products/variants, inventory, orders, payments, analytics |
| Super Admin | `/admin/dashboard` | Users, stores, products, orders, inventory, sales, payments, reports, settings |

---

## 4. Feature Checklist (vs brief)

### Week 1 — Architecture & Auth
- [x] Schema: Users, Stores, Products, Orders, Categories
- [x] Express server + MongoDB
- [x] JWT access + httpOnly refresh cookie
- [x] RBAC (`authenticate` / `authorize`)
- [x] Register / Login / OTP verify / Forgot & reset password
- [x] Flipkart-themed auth UI

### Week 2 — Inventory & Store
- [x] Store CRUD (vendor-scoped)
- [x] Product CRUD + Cloudinary images
- [x] Product variants (color/size/stock)
- [x] Vendor dashboard for catalog & stock

### Week 3 — Cart, Checkout & Payments
- [x] Redux cart
- [x] Checkout (one store per order)
- [x] Razorpay online payments + signature verify
- [x] COD flow
- [x] Order confirmation & payment receipt emails
- [x] Guest browse / login-required purchase

### Week 4 — Analytics, Hardening & Docs
- [x] Admin analytics (stats + Recharts 7-day chart)
- [x] Vendor analytics (revenue, status bars, 7-day chart)
- [x] Helmet.js security headers
- [x] MongoDB indexes
- [x] Health check endpoint
- [x] Pagination on list pages
- [x] Project documentation (this file)
- [x] CI workflow (frontend build)

**Note:** Brief mentioned Stripe; this project implements **Razorpay** (same payment goals: gateway checkout + order confirmation). Tailwind is installed; shop UI uses dedicated Flipkart CSS for brand fidelity.

---

## 5. API Overview

Base URL: `http://localhost:3000/api`  
Health: `GET http://localhost:3000/health`

### Auth `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Create user + OTP email (customer/vendor only) |
| POST | `/verify-email` | Public | Verify OTP |
| POST | `/login` | Public | Customer/vendor JWT login (admins blocked) |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Cookie | Clear session |
| POST | `/forgotPassword` | Public | Reset email (`portal`: customer\|vendor\|admin) |
| PATCH | `/resetPassword/:token` | Public | Set new password |
| PATCH | `/changePassword` | JWT | Change password |

### Admin portal `/api/admin/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/status` | Public | Whether first admin setup is needed |
| POST | `/login` | Public | Super Admin login only |
| POST | `/logout` | Cookie | Admin logout |
| POST | `/create` | Setup secret (first) / Super Admin JWT | Create Super Admin |
| GET | `/admins` | JWT Super Admin | List Super Admins |

Frontend admin URLs: `/admin/login`, `/admin/setup` (first admin), then `/admin/*` panel.

### Vendor portal `/api/vendor/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Create vendor + OTP email |
| POST | `/login` | Public | Vendor login only |
| POST | `/logout` | Cookie | Vendor logout |

Frontend vendor URLs: `/vendor/register`, `/vendor/login`, then `/vendor/*` panel.  
Customer auth stays on `/register` and `/login` (`/api/auth`).

### Order `/api/order` (payment-related)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create` | Customer | Place order (+ Razorpay session if online) |
| POST | `/pay/:id` | Customer | Create Razorpay session for pending |
| POST | `/verify-payment` | Customer | Verify Razorpay signature |
| PUT | `/payment/:id` | Vendor/Admin | Mark paid / refund / failed |
| GET | `/razorpay/config` | Public | Configured flag + key id |

### Dashboard `/api/dashboard`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | Super Admin | Users, orders, stock, sales, 7-day report |

Full route tables for User, Store, Product are in `README.md`.

---

## 6. Frontend Routes

| Path | Access | Purpose |
|------|--------|---------|
| `/`, `/login`, `/register`, `/verify-email` | Public | Landing & auth |
| `/forgot-password`, `/resetPassword/:token` | Public | Customer password recovery |
| `/admin/forgot-password` | Public | Admin password recovery |
| `/vendor/forgot-password` | Public | Vendor password recovery |
| `/customer`, `/customer/products`, `/customer/products/:id` | Public browse | Catalog |
| `/customer/cart`, `/orders`, `/payments`, `/account/*`, `/stores*` | Customer JWT | Shopping & account |
| `/vendor/*` | Vendor JWT | Store operations + analytics |
| `/admin/*` | Super Admin JWT | Platform control |

---

## 7. Data Models (core)

- **User** — email, password (bcrypt), role, OTP, refreshToken, isActive, tenantId
- **Store** — storeName, vendorId (1:1), contact, isActive
- **Product** — vendor, store, category, price, stock, images, **variants[]**, status
- **Order** — customerId, storeId, totals, paymentMethod/Status, razorpayOrderId, orderStatus
- **OrderItem** — orderId, productId, quantity, price
- **Category** — name, slug for shop filters

---

## 8. Local Setup

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Gmail App Password (OTP/emails)
- Cloudinary account
- Razorpay Test keys

### Backend
```bash
cd backend
cp .env.example .env
# fill MONGODB_URL, JWT_*, CLIENT_URL, EMAIL_*, CLOUDINARY_*, RAZORPAY_*
npm install
npm run dev   # http://localhost:3000
```

### Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api
npm install
npm run dev   # http://localhost:5173
```

### Optional seed
```bash
cd backend
node scripts/seedProducts.js
```

---

## 9. Demo Flow

1. Register **vendor** → verify OTP → create store → add products (images + optional variants)
2. Browse as **guest** on `/customer` (view only)
3. Register **customer** → verify OTP → add to cart → checkout (Razorpay or COD)
4. Vendor updates order status / payment on `/vendor`
5. Super Admin opens `/admin/dashboard` for platform analytics

---

## 10. Security Notes

- Passwords hashed with bcrypt (salt rounds 12)
- Access token in `Authorization: Bearer`
- Refresh token in httpOnly cookie
- Helmet sets secure HTTP headers
- Role checks on every protected route
- Razorpay payments verified with HMAC signature
- Deactivated users cannot login

---

## 11. Deployment Guidance

| Layer | Suggested host |
|-------|----------------|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway / AWS EC2 |
| Database | MongoDB Atlas |
| Media | Cloudinary |
| Payments | Razorpay Live keys |

Set production env vars (`CLIENT_URL`, secrets, CORS origin). CI builds frontend on push (see `.github/workflows/ci.yml`).

---

## 12. Folder Map

```
backend/
  configs/      database, mail, cloudinary, env, redis
  controllers/  auth, store, product, order, user, dashboard, catalog,
                coupon, review, banner, address, chat, media, payout, notification
  middlewares/  auth, upload
  models/       mongoose schemas + indexes (incl. catalogProduct, payout,
                notification, mediaAsset, chatSession)
  routers/      Express routers
  services/     email, razorpay, invoice PDF, store
  scripts/      seed helpers (seed:demo, seed:catalog, seed:master)
frontend/
  src/api/      axios instance + services
  src/features/ redux slices (user, cart, wishlist)
  src/layouts/  Customer (shop), Vendor/Admin (panel), Auth
  src/pages/    role-based screens
  src/components/ Pagination, charts, ProductCard
```

---

## 13. 4-Week Timeline Mapping

| Week | Brief goal | Status in repo |
|------|------------|----------------|
| 1 | Architecture + JWT RBAC + React auth | Done |
| 2 | Store/Product CRUD + Cloudinary + Vendor UI | Done |
| 3 | Cart + gateway payments + checkout emails | Done (Razorpay) |
| 4 | Analytics charts + hardening + docs/CI | Done |

---

*MultiCommerce — Multi-Tenant E-Commerce Platform (SaaS)*
