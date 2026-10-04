# 04 — API Modules

Backend lives in `backend/`. Entry: `server.js` → mounts everything under **`/api`**.

---

## 1. Folder responsibilities

| Folder | Role |
|---|---|
| `configs/` | DB connect, env, Cloudinary, mail |
| `models/` | Mongoose schemas |
| `routers/` | HTTP route definitions |
| `controllers/` | Request handlers (business logic) |
| `middlewares/` | Auth, validation, uploads |
| `services/` | Email, Razorpay, invoice PDF, store helpers |
| `utils/` | Tokens, pricing, SKU, bulk import, Cloudinary upload |
| `scripts/` | One-off seeds (e.g. products) |

---

## 2. Request pipeline

```text
Client
  → CORS + helmet + json + cookies
  → ensureDb()   (connect Mongo, important on Vercel cold start)
  → /api/... router
       → authenticate? (JWT)
       → authorize(roles)?
       → multer? (files)
       → controller
       → JSON / PDF / file response
```

---

## 3. Middleware cheat-sheet

| Middleware | File | Job |
|---|---|---|
| `authenticate` | `authMiddleware.js` | Read Bearer JWT → `req.user = { id, role }` |
| `authorize(...roles)` | same | Role gate |
| `verifyAccessToken` | same | Change-password flows |
| `loginValidation` / forgot validators | `emailMiddleware.js` | express-validator |
| `upload` | `uploadMiddleware.js` | Product/banner/review images |
| `uploadSpreadsheet` | `uploadSpreadsheet.js` | CSV/XLSX bulk |

---

## 4. Route map (all prefixed with `/api`)

### Auth

| Method | Path | Who |
|---|---|---|
| POST | `/auth/register` | Customer signup |
| POST | `/auth/verify-email` | OTP verify |
| POST | `/auth/login` | Customer login |
| POST | `/auth/refresh` | Rotate access token |
| POST | `/auth/logout` | Clear refresh |
| POST | `/auth/forgotPassword` | Reset email |
| PATCH | `/auth/changePassword` | Logged-in change |
| PATCH | `/auth/resetPassword/:token` | Token reset |
| POST | `/vendor/auth/register\|login\|logout` | Vendor portal |
| POST | `/admin/auth/login\|logout\|create` | Admin portal |
| GET | `/admin/auth/status` \| `/admins` | Admin helpers |

### Domain APIs

| Mount | Key operations | Ownership / roles |
|---|---|---|
| `/store` | CRUD store; `GET /vendor/:vendorId` | Vendor owns one store; superAdmin any |
| `/product` | create, vendor list, CRUD, search/filter, bulk import/mark/delete, template | Create/update scoped to store owner |
| `/order` | create, pay, verify-payment, status, cancel/return, invoice PDF | Customer owns order; vendor owns store; superAdmin any |
| `/address` | customer shipping address book + default | Customer only |
| `/category` | list/create/update | Public read; admin write |
| `/review` | product reviews + vendor/admin manage | Customer writes; vendor sees own products |
| `/banner` | public list + manage CMS | Vendor (own store) / admin |
| `/coupon` | active list, validate, vendor/admin CRUD | Vendor (own store) / admin |
| `/chat` | MultiAssist support: customer bot, vendor inbox/replies | Customer / vendor |
| `/media` | vendor media library (Cloudinary assets) | Vendor owns assets |
| `/payout` | vendor request payout; admin list/pay/reject | Vendor / admin |
| `/notification` | list, unread-count, mark-read, mark-all | Recipient only |
| `/catalog` | master catalog: `GET /brands`, list, `GET /:id`; admin CRUD | Browse: vendor/admin · Manage: admin only |
| `/user` | admin user admin ops | superAdmin |
| `/dashboard` | `GET /stats` platform analytics | Role-scoped |

**Master catalog** (`/catalog`) is a company-managed template library (brand → product → models/specs). Vendors browse it and auto-fill their own listing; it is **not** a sellable product. See `catalogProductModel.js` / `catalogController.js`.

Health: `GET /health` (connects DB on serverless).

---

## 5. Utility modules (why they exist)

| File | Purpose |
|---|---|
| `generateToken.js` | Access + refresh JWTs |
| `productPricing.js` | Safe server-side totals |
| `bulkProductImport.js` | Spreadsheet → products |
| `generateProductSku.js` | Unique SKUs |
| `uploadToCloudinary.js` | Buffer upload helper |
| `cookieOptions.js` | Secure cookie flags |

| Service | Purpose |
|---|---|
| `emailService.js` | OTP, receipts |
| `razorpayService.js` | Orders + verify |
| `invoicePdfService.js` | Tax invoice PDF |
| `storeService.js` | Shared store CRUD |

---

## 6. Environment (see `backend/.env.example`)

Mongo, JWT secrets/expiry, `CLIENT_URL`, Cloudinary, Razorpay, Email, `ADMIN_SETUP_SECRET`.
