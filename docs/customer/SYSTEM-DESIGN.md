# Customer System Design

**Scope:** Customer-facing ecommerce portal for browsing, shopping, checkout, order tracking, wishlist, reviews, support, notifications, and account management.

**Reference pattern:** Amazon for personalization and saved checkout, Flipkart for mobile-first search and filters, Shopify storefronts for clean product detail pages, and marketplace apps for store-level trust and order support.

---

## 1. Customer Domains

| Domain | Purpose | Core Objects |
|--------|---------|--------------|
| Identity | Login, register, profile, password, refresh session | User, Address |
| Discovery | Home, search, categories, filters, recently viewed | Product, Category, Store |
| Product Detail | Product content, variants, images, price, stock, reviews | Product, Review, Media |
| Cart | Temporary buying intent across sessions | Cart item, Product variant |
| Checkout | Address, coupon, shipping, payment, order creation | Address, Coupon, Order |
| Orders | Order history, status tracking, invoice, returns | Order, OrderItem |
| Wishlist | Save for later and return reminders | Wishlist item |
| Notifications | Order updates, offers, wishlist changes, support replies | Notification |
| Support | Ask seller/platform, product questions, order help | ChatSession, Message |
| Reviews | Customer rating and feedback after delivery | Review |

---

## 2. Customer Data Model

```text
User(customer)
  ├─ Address[]
  ├─ Cart items (frontend/redux today; can persist later)
  ├─ Wishlist products
  ├─ Orders
  │   ├─ OrderItems
  │   └─ Payment status + fulfillment status
  ├─ Reviews
  ├─ ChatSessions
  └─ Notifications

Store
  ├─ Products
  ├─ Coupons
  └─ Orders linked by storeId
```

### Key Design Choice

Customers do not need to understand tenants. They shop across many stores, but the UI should make store context visible only where it matters:

- Product page: “Sold by StoreName”
- Cart: grouped by store if shipping/coupons differ
- Order detail: store, seller support, invoice, delivery status
- Returns/support: route to the right store/order automatically

---

## 3. API Surface

| Area | Endpoint Shape | Customer Need |
|------|----------------|---------------|
| Catalog | `GET /api/product`, `GET /api/product/:id` | Browse/search products |
| Category | `GET /api/category` | Category navigation |
| Store | `GET /api/store/:id` | Store trust and products |
| Cart | Local now; future `GET/POST /api/cart` | Cross-device cart |
| Address | `GET/POST/PUT/DELETE /api/address` | Saved checkout |
| Coupon | `POST /api/coupon/validate` | Discount confidence |
| Order | `POST /api/order/create`, `GET /api/order/customer/:id` | Checkout and history |
| Payment | `POST /api/order/pay/:id`, verify payment | Online payment |
| Invoice | `GET /api/order/:id/invoice` | Records and trust |
| Review | `POST /api/review` | Post-purchase feedback |
| Wishlist | Existing account wishlist page; formal API if needed | Save for later |
| Chat | `POST /api/chat/session`, messages | Contextual support |
| Notification | Customer version planned | Order/offer alerts |

---

## 4. Core Flows

### Browse To Buy

```text
Home/category/search
  → product list filters
  → product detail
  → add to cart / buy now
  → address
  → coupon
  → payment method
  → order created
  → payment verify if online
  → order confirmation + notification
```

### Repeat Purchase

```text
Account → Orders
  → reorder / buy similar
  → prefilled address
  → saved payment method (future)
  → confirmation
```

### Return / Support

```text
Order detail
  → return / cancel if eligible
  → reason + optional message
  → status timeline
  → support thread if stuck
```

---

## 5. Notification Events

| Event | Trigger | Link |
|-------|---------|------|
| `order.created` | Order placed | `/customer/orders` |
| `payment.paid` | Payment verified | `/customer/orders` |
| `order.confirmed` | Vendor accepts | `/customer/orders/:id` |
| `order.shipped` | Vendor ships | `/customer/orders/:id` |
| `order.delivered` | Order delivered | review prompt |
| `return.updated` | Return status changes | order detail |
| `coupon.available` | Relevant coupon | product/category |
| `wishlist.price_drop` | Saved item price drops | wishlist/product |
| `support.reply` | Vendor/admin reply | support thread |

---

## 6. Security & Trust

- Customer can only read/update their own profile, addresses, orders, wishlist, reviews, and chats.
- Order ownership is checked by `customerId`.
- Payment verification must happen server-side.
- Invoice download requires customer ownership or admin/vendor authorization.
- Address and phone data should never leak to unrelated vendors.
- Support threads must be scoped to customer + store/order.

---

## 7. Scale & Performance

| Problem | Design |
|---------|--------|
| Product list loads slowly | Pagination, indexed filters, cached category shelves |
| Search is weak | Add search index, autocomplete, typo tolerance later |
| Large product images | responsive images, CDN transformations |
| Repeat browsing | recently viewed local cache + server sync later |
| Checkout drop-off | keep address and coupon validation fast |
| Order page noisy | timeline summary first, details behind sections |

---

## 8. Future Architecture

1. Persist cart server-side for cross-device shopping.
2. Add customer notifications to the persisted Notification model.
3. Add recommendation service based on browsing, wishlist, and order history.
4. Add search service with autocomplete and ranked filters.
5. Add return/refund workflow with vendor/admin decisions.
6. Add saved payment tokens through a payment provider, not raw card storage.

