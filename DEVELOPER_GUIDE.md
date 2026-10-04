# MultiCommerce — Developer Guide

This document is the **mental model** of the project: how data moves, which portals exist, which files own which concerns, and how to extend the system safely.

For API tables and setup commands, see also [DOCUMENTATION.md](./DOCUMENTATION.md) and [README.md](./README.md).

---

## 1. What this product is

MultiCommerce is a **multi-tenant marketplace SaaS**:

| Actor | What they do |
|-------|----------------|
| **Customer** | Browse catalog, cart, checkout (Razorpay / COD), track orders |
| **Vendor** | Own one store, catalog (SKU/variants/images), fulfill orders, payments |
| **Super Admin** | Platform oversight: users, stores, products, orders, analytics, settings |

**Tenant rule:** one vendor → one store. Products and orders are scoped to that store. Vendors never see another vendor’s data.

---

## 2. Runtime map (start here)

```
Browser (Vite :5173)
  │  axios → VITE_API_URL (default http://localhost:3000/api)
  │  Bearer access token (localStorage) + refresh cookie (httpOnly)
  ▼
Express (backend/server.js :3000)
  │  Helmet, CORS(CLIENT_URL), cookieParser
  │  Mount: app.use("/api", routers/index.js)
  ▼
Routers → Controllers → Models/Services
  │
  ├── MongoDB (Users, Stores, Products, Orders, Categories)
  ├── Cloudinary (product images)
  ├── Nodemailer (OTP, reset, order/payment emails)
  └── Razorpay (online checkout + signature verify)
```

**Health check (no auth):** `GET http://localhost:3000/health`

---

## 3. Three auth portals (do not mix)

Accounts are **role-locked** to the portal that created/signed them in.

| Portal | Frontend entry | API base | Role |
|--------|----------------|----------|------|
| Customer | `/login`, `/register` | `/api/auth` | `customer` |
| Vendor | `/vendor/login`, `/vendor/register` | `/api/vendor/auth` | `vendor` |
| Admin | `/admin/login`, `/admin/setup` | `/api/admin/auth` | `superAdmin` |

### Shared password endpoints (all roles)

Still under `/api/auth` (JWT or public token):

| Action | Endpoint | Notes |
|--------|----------|--------|
| Forgot password | `POST /api/auth/forgotPassword` | Body: `{ email, portal }` where `portal` = `customer` \| `vendor` \| `admin` |
| Reset password | `PATCH /api/auth/resetPassword/:token` | Email link includes `?portal=` |
| Change password | `PATCH /api/auth/changePassword` | Requires JWT; clears refresh session |

### Frontend recovery URLs

| Portal | Forgot page | Reset page | Login after reset |
|--------|-------------|------------|-------------------|
| Customer | `/forgot-password` | `/resetPassword/:token?portal=customer` | `/login` |
| Vendor | `/vendor/forgot-password` | `...?portal=vendor` | `/vendor/login` |
| Admin | `/admin/forgot-password` | `...?portal=admin` | `/admin/login` |

If a user hits the wrong portal’s forgot page, API returns `usePortal` and the UI redirects.

### First Super Admin

1. Set `ADMIN_SETUP_SECRET` in `backend/.env`
2. Open `/admin/setup` while no admin exists (`GET /api/admin/auth/status`)
3. Later admins: create from `/admin/settings` while logged in as Super Admin

---

## 4. End-to-end product flows

### 4.1 Vendor onboarding → catalog

```
/vendor/register
  → POST /api/vendor/auth/register
  → email OTP
  → /verify-email?portal=vendor
  → /vendor/login
  → /vendor/store          (create store: store.vendorId = user.id)
  → /vendor/products       (multipart images → Cloudinary; SKU auto-generated)
  → /vendor/inventory|alerts|shipping|orders|payments
```

**Key backend files**

- `controllers/vendorAuthController.js`
- `controllers/storeController.js` + `services/storeService.js`
- `controllers/productController.js` + `utils/generateProductSku.js`
- `utils/uploadToCloudinary.js`

**SKU:** server builds from brand/name/color/size + uniqueness suffix. UI shows a live preview only; final SKU comes from API.

### 4.2 Customer browse → checkout

```
Guest: /customer, /customer/products, /customer/products/:id   (public)
Login required for cart/checkout:
  /login → JWT → Redux userSlice + localStorage token
  /customer/cart
    → POST /api/order/create  { customerId, storeId, items, paymentMethod }
       ├─ COD  → order Pending, "Pay on delivery"
       └─ UPI/Card/... → create Razorpay order, return razorpay { key, orderId, amount }
  → Razorpay Checkout (browser)
  → POST /api/order/verify-payment  (HMAC signature)
       → paymentStatus Paid, orderStatus Confirmed (if was Pending)
  → emails: order confirmation + payment receipt
```

**Rules**

- One **store per order** (cart must not mix stores).
- Online methods require `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
- Vendor/admin can later `PUT /api/order/payment/:id` for COD mark-paid / refund.

**Key files**

- Frontend: `pages/customer/CustomerCart.jsx`, Redux `features/cart/`
- Backend: `controllers/orderController.js`, `services/razorpayService.js`, `services/emailService.js`

### 4.3 Order lifecycle

```
Pending → Confirmed → Processing → Shipped → Delivered
   │          │                        │
Cancelled  Cancelled                Returned
```

- Vendors follow allowed transitions.
- Super Admin can set any valid status (override) from admin orders UI.
- Payment statuses: `Pending | Paid | Failed | Refunded` (independent of fulfillment).

### 4.4 Admin platform loop

```
/admin/login → /admin/dashboard  (GET /api/dashboard/stats)
  Users (activate/deactivate), Stores, Products, Categories
  Orders, Inventory, Alerts, Sales, Customers, Payments
  Coupons (localStorage helper UI), Reviews hub, Reports, Settings
  Profile + Change password (/admin/change-password)
```

Deactivating a user clears their refresh token and blocks login.

---

## 5. Frontend architecture (developer view)

```
frontend/src/
  App.jsx                 ← all routes + <ToastContainer />
  api/
    apiInstaince.js       ← axios + Bearer interceptor + credentials
    services.js           ← thin API wrappers (userApi, productApi, …)
  app/store.js            ← Redux: user, cart, wishlist, notification
  features/
    user/userSlice.js
    cart/cartSlice.js
    wishlist/wishlistSlice.js
    notification/notificationSlice.js
  utils/notify.js         ← notify.success|error|warning|fromError
  hooks/useNotify.js
  components/notifications/ToastContainer.jsx
  layouts/                ← CustomerLayout, VendorLayout, AdminLayout, AuthLayout
  pages/
    authentication/       ← customer auth + shared Forgot/Reset (portal prop)
    admin/ | vendor/ | customer/ | shared/
```

### Auth state

- Access token: `localStorage.token`
- User snapshot: `localStorage.user` + Redux `user`
- Refresh: httpOnly cookie `refreshToken` (`POST /api/auth/refresh`)

### Protected routes

`components/ProtectedRoute.jsx` checks `isAuthenticated` + allowed `roles` (`customer` | `vendor` | `superAdmin`).

### Notifications (use this, not `alert`)

```js
import { notify } from "../utils/notify";
notify.success("Saved");
notify.fromError(err, "Fallback message");
```

Admin/vendor panels and password flows already use this toast system.

### Panel menus

Nested sidebar groups live in:

- `layouts/AdminLayout.jsx`
- `layouts/VendorLayout.jsx`
- shared `components/SidebarNav.jsx`

---

## 6. Backend architecture (developer view)

```
backend/
  server.js
  routers/index.js          ← mounts all /api/* trees
  routers/*.js
  controllers/*.js          ← HTTP in/out, validation responses
  models/*.js               ← Mongoose schemas + indexes
  services/                 ← email, razorpay, store helpers
  middlewares/
    authMiddleware.js       ← verifyAccessToken, authorize(roles)
    emailMiddleware.js      ← login/forgot validators (trim+lowercase email)
    uploadMiddleware.js     ← Multer memory → Cloudinary
  configs/                  ← env, db, mail, cloudinary
  utils/                    ← tokens, SKU, upload helpers
```

### Request path example

`PATCH /api/auth/changePassword`

1. `authRouter` → `verifyAccessToken`
2. `authController.changePassword`
3. Load user `+password`, bcrypt compare, set new hash, `refreshToken = null`, clear cookie
4. Frontend: toast → logout endpoint for portal → navigate to portal login

### Important auth controllers

| File | Owns |
|------|------|
| `authController.js` | Customer register/login, OTP, refresh, logout, forgot/reset/change password |
| `vendorAuthController.js` | Vendor register/login/logout |
| `adminAuthController.js` | Admin status, login, logout, create, list |

Customer `/api/auth/login` **rejects** `vendor` and `superAdmin` (forces correct portal).

---

## 7. Data model relationships

```
User (role: customer | vendor | superAdmin)
  │
  ├─ vendor ──1:1──► Store (vendorId unique)
  │                    │
  │                    ├─► Product (vendor, store, category, sku, variants[], images[])
  │                    └─► Order (storeId) ◄── Customer User (customerId)
  │                           │
  │                           └─► OrderItem (productId, qty, price)
  │
  └─ Category (admin-managed; products reference category)
```

**Isolation checks to preserve when editing code**

- Vendor product queries: `vendor: req.user.id`
- Vendor order/payment updates: store’s `vendorId` must match `req.user.id`
- Customer order access: `order.customerId === req.user.id` (unless admin)

---

## 8. Env vars (must understand)

### Backend `.env` (from `.env.example`)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URL` | Database |
| `PORT` | API port (3000) |
| `JWT_TOKEN_SECRET` | Access JWT |
| `JWT_REFRESH_SECRET` | Refresh JWT |
| `CLIENT_URL` | Frontend origin + reset-link host (`http://localhost:5173`) |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail app password for Nodemailer |
| `CLOUDINARY_*` | Product images |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Online payments |
| `ADMIN_SETUP_SECRET` | First Super Admin bootstrap |

### Frontend `.env`

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | `http://localhost:3000/api` |

If reset emails open the wrong host, fix `CLIENT_URL`.

---

## 9. Where to change common things

| Goal | Start here |
|------|------------|
| New customer page | `frontend/src/pages/customer/` + route in `App.jsx` |
| New vendor menu item | `layouts/VendorLayout.jsx` + page + `App.jsx` |
| New admin report | `controllers/dashboardController.js` or page under `pages/admin/` |
| New order status | `orderModel` enum + `updateOrderStatus` transitions + UI selects |
| Email copy | `services/emailService.js` |
| Toast styling | `components/notifications/ToastContainer.css` |
| Login email validation | `middlewares/emailMiddleware.js` (do **not** use aggressive `normalizeEmail()` — strips Gmail dots) |
| Auto SKU rules | `utils/generateProductSku.js` |

---

## 10. Local run checklist

```bash
# Terminal 1 — API
cd backend && cp .env.example .env   # fill secrets
npm install && npm run dev

# Terminal 2 — UI
cd frontend && cp .env.example .env
npm install && npm run dev
```

**Smoke test path**

1. Vendor register → OTP → store → product  
2. Customer register → OTP → cart → COD order  
3. Vendor confirms order / payment  
4. Admin login → dashboard charts  

Optional: `node backend/scripts/seedProducts.js`

---

## 11. Conventions for contributors

1. **Keep portals separated** — never allow vendor signup on customer `/register` or admin login on `/login`.
2. **Prefer `notify.*`** for UX feedback in admin/vendor (and new features).
3. **Validate role + ownership** on every mutating order/product endpoint.
4. **Do not commit `.env`** — only `.env.example`.
5. **Payments:** verify Razorpay signature server-side; never trust client-only “paid” flags.
6. After change-password / reset-password, force re-login (refresh token cleared).

---

## 12. Quick file index

| Concern | Path |
|---------|------|
| API mount | `backend/server.js`, `backend/routers/index.js` |
| Customer auth | `backend/controllers/authController.js` |
| Vendor auth | `backend/controllers/vendorAuthController.js` |
| Admin auth | `backend/controllers/adminAuthController.js` |
| Orders + Razorpay | `backend/controllers/orderController.js` |
| Dashboard stats | `backend/controllers/dashboardController.js` |
| Routes (UI) | `frontend/src/App.jsx` |
| Axios | `frontend/src/api/apiInstaince.js` |
| Toasts | `frontend/src/utils/notify.js` |
| Change password UI | `frontend/src/pages/shared/ChangePasswordPage.jsx` |
| Forgot/Reset UI | `frontend/src/pages/authentication/ForgotPassword|ResetPassword/` |
| Product docs | `DOCUMENTATION.md` |

---

*Use this guide to orient; use DOCUMENTATION.md for endpoint/checklists; use README.md for quick start.*
