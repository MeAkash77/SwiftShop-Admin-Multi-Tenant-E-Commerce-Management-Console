# 02 — Project Flow

Step-by-step flows for the main features.

---

## A. Customer registration & login

```text
Register (/register)
   → POST /api/auth/register
   → Email OTP sent
   → Verify (/verify-email) → POST /api/auth/verify-email
   → Login → POST /api/auth/login
   → accessToken (localStorage) + refreshToken (cookie)
   → Browse /customer
```

Password reset: Forgot → email link → `PATCH /api/auth/resetPassword/:token`.

---

## B. Vendor onboarding

```text
/vendor/register → POST /api/vendor/auth/register
   → Verify email (same /auth/verify-email)
   → /vendor/login → POST /api/vendor/auth/login
   → Create store → POST /api/store
   → Add products → POST /api/product/create
     or bulk CSV/XLSX → POST /api/product/bulk/import
```

Without a store, product create/import is blocked.

---

## C. Admin bootstrap

```text
First time: /admin/setup
   → POST /api/admin/auth/create + ADMIN_SETUP_SECRET
Later admins: Super Admin creates via same endpoint with JWT
Login: POST /api/admin/auth/login → /admin/dashboard
```

---

## D. Product lifecycle (vendor)

```text
1. Choose product type (mobile, fashion, …) → option groups / variants
2. Upload images (multipart) → Cloudinary
3. SKU/slug auto-generated
4. Status: active | inactive
5. Bulk table: mark active/inactive or delete (POST /product/bulk/mark|delete)
6. Inventory / low-stock alerts in vendor panel
```

Customer search: `GET /api/product/search` and `/filter`.

---

## E. Cart → checkout → payment

```text
Customer adds items → Redux cart (localStorage)
   → Must have Address (POST /api/address) before checkout
   → Cart groups by storeId
   → For each store: POST /api/order/create
        body: { storeId, items[], paymentMethod, addressId | shippingAddress }
   → Server:
        • validates products belong to store
        • recomputes prices (ignore client totals)
        • creates Order + OrderItems
```

### Payment paths

| Method | Flow |
|---|---|
| **COD** | `paymentStatus=Pending`, pay on delivery |
| **Online (Razorpay)** | Create Razorpay order → Checkout modal → `POST /order/verify-payment` (signature + amount) → Paid + Confirmed |

Vendor/admin can later mark payment via `PUT /order/payment/:id`.

---

## F. Order fulfillment (vendor)

```text
Pending → Confirmed → Processing → Shipped → Delivered
                ↘ Cancelled
Delivered → Returned (allowed next status)
```

UI: Vendor Orders page with status action buttons.

---

## G. Tax invoice PDF

```text
GET /api/order/:id/invoice
Allowed: owning customer | vendor of store | superAdmin
Only when orderStatus === "Delivered"
(Not available for Cancelled / Returned)
```

PDF built by `invoicePdfService.js`.

---

## H. Reviews & marketing

**Reviews:** Customer posts for purchased products → shown on product detail; vendor/admin manage via Reviews hub.

**Banners:** Vendor/admin create slider/offer/category tiles → public `GET /api/banner` on shop home.

---

## I. Session refresh (frontend)

```text
API returns 401
  → axios interceptor calls POST /auth/refresh (cookie)
  → new accessToken stored
  → retry original request
  → if refresh fails → logout
```

App start: `bootstrapSession()` if token exists.

---

## J. End-to-end happy path (diagram)

```text
Customer                Frontend                 API                    DB/External
   |                       |                      |                          |
   |-- login ------------->|-- /auth/login ------>|-- verify user ---------->|
   |<-- token -------------| <--------------------|                          |
   |-- add to cart ------->| cart slice           |                          |
   |-- checkout ---------->|-- /order/create ---->|-- calc price ----------->|
   |                       |                      |-- save Order ----------->|
   |-- pay Razorpay ------>|-- verify-payment --->|-- Razorpay verify ------->|
   |                       |                      |-- mark Paid ------------>|
   |-- track order ------->|-- /order/customer -->|-- query ---------------->|
Vendor marks Delivered --->|-- /order/status ---->|-- update --------------->|
   |-- invoice PDF ------->|-- /order/:id/invoice-|-- pdfkit --------------->|
```
