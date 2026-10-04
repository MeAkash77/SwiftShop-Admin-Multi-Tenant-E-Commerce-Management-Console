# 08 — 5-Person × 5-Week Team Plan

How a five-person team ships MultiCommerce across five weeks (~125 person-days). Most of weeks 1–4 are already in the repo; week 5 finishes demo-critical polish.

---

## Timeline

```text
Week 1 → Week 2 → Week 3 → Week 4 → Week 5
 Auth       Catalog    Cart/Pay    Panels      Coupons + QA
 Store      Bulk       Orders      Reviews
```

| Week | Focus | Owner roles | Status |
|------|--------|-------------|--------|
| 1 | Customer / vendor / admin portals, JWT + OTP, store CRUD | Auth + Store | Done |
| 2 | Products, variants, Cloudinary, bulk import | Catalog | Done |
| 3 | Cart, addresses, Razorpay / COD, fulfillment | Orders | Done |
| 4 | Vendor / admin panels, reviews, banners, analytics | Panels | Done |
| 5 | Coupons E2E, shipping fees, honest account UX, seed + smoke tests | Polish | Done (this pass) |

---

## Role map (suggested)

| Role | Primary ownership |
|------|-------------------|
| Auth + Store | Portals, JWT/OTP, store settings |
| Catalog | Products, variants, images, bulk import |
| Orders | Cart, addresses, payments, status / invoice |
| Panels | Vendor / admin dashboards, reviews, banners, analytics |
| Polish | Coupons, shipping honesty, docs, seed, CI smoke |

---

## Week 5 completed checklist

- [x] Real coupons (model + API + checkout apply + vendor/admin manager UI)
- [x] Shipping fee from store (`shippingFee` / `freeShippingAbove`) on order create
- [x] Customer **My Reviews** wired to `GET /review/me`
- [x] Account nav: fake items (PAN, gift cards, saved UPI/cards, Plus, Rewards) removed from primary nav
- [x] Notifications from recent orders (not marketing fluff)
- [x] Wishlist labeled as device-local
- [x] Return uses clear “return requested” note — no fake gateway “Refunded”
- [x] `seedDemo` script + `node --test` smoke (auth, COD order, vendor isolation)
- [x] CI runs smoke tests against MongoDB service

---

## Out of scope (intentionally)

- Gift cards, Plus, Rewards, PAN, saved cards
- Vendor payouts / commissions
- Razorpay webhooks + automatic refunds API
- Guest multi-store single checkout
- Push notifications

---

## Demo success criteria

1. Vendor creates a coupon → customer applies it at checkout → order total reflects discount.  
2. Shipping fee matches store shipping settings (or free above threshold).  
3. No primary account nav item that is an empty placeholder.  
4. My Reviews lists real reviews from the API.  
5. Seed script + smoke tests pass in CI.
