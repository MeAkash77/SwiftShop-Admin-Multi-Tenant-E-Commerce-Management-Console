# 05 — Frontend Architecture

Frontend lives in `frontend/src/` (Vite + React).

---

## 1. Folder map

| Path | Responsibility |
|---|---|
| `main.jsx` | App bootstrap, Redux Provider, Font Awesome |
| `App.jsx` | All routes + session bootstrap |
| `api/` | Axios instance + `services.js` API facades |
| `app/store.js` | Redux store |
| `features/` | Slices: user, cart, wishlist, notification |
| `layouts/` | Customer / Vendor / Admin / Panel shells |
| `pages/` | Screens by role + shared hubs |
| `components/` | ProtectedRoute, charts, Pagination, shop widgets |
| `hooks/` | Pagination, theme, customer auth helpers |
| `styles/` | panel.css, shop.css, auth.css |
| `utils/` | notify, invoice download, pricing helpers |

---

## 2. State management

| Slice | Storage | Holds |
|---|---|---|
| `user` | localStorage token + user | Auth session |
| `cart` | localStorage | Line items until checkout |
| `wishlist` | localStorage | Saved products |
| `notification` | memory | Toast messages |

---

## 3. API client (`apiInstaince.js`)

1. Attach `Authorization: Bearer <token>` on every request.  
2. On **401**, call `/auth/refresh` with cookies, queue retries.  
3. `bootstrapSession()` on app load restores session.  

Typed helpers in `services.js`: `productApi`, `orderApi`, `storeApi`, …

---

## 4. Layouts & theme

| Layout | Theme |
|---|---|
| `CustomerLayout` | Shop (Flipkart-like) light |
| `AdminLayout` | Dark analytics |
| `VendorLayout` | `usePanelTheme` light/dark → body `data-panel-theme` |

Vendor UI CSS: `VendorWorkspace.css` + shared `panel.css`.

---

## 5. Pages by role (summary)

### Customer
Home, products, product detail, cart, orders, payments, account (profile, addresses, wishlist), info pages.

### Vendor
Overview dashboard, store, shipping, products wizard, **All Products table** (bulk), inventory, alerts, orders, payments, coupons, reviews, marketing, settings (theme).

### Admin
Dashboard stats, users, stores, products, categories, orders, inventory, sales, customers, payments, reports, marketing, settings.

Shared: `StockAlerts`, `CouponsManager`, `ReviewsHub`, `MarketingBanners`.

---

## 6. Protection pattern

```jsx
<ProtectedRoute roles={["vendor"]}>
  <VendorLayout />  {/* Outlet for child routes */}
</ProtectedRoute>
```

Wrong role → redirected to that role’s home; no token → login portal.

---

## 7. How to add a feature (checklist)

1. Backend model + controller + router (document in `docs/03` + `04`).  
2. Add method to `services.js`.  
3. Create page under correct role folder.  
4. Register route in `App.jsx` + sidebar menu.  
5. Add file-header comment explaining the module.  
