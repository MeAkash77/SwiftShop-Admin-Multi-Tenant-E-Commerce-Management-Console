# Customer Roadmap

This roadmap turns the customer system/UI plan into build waves. It assumes the current app already has catalog, cart, checkout, orders, wishlist/account pages, reviews, coupons, and support basics.

---

## Wave A — Fix Daily Shopping Basics

**Goal:** Make the current customer flow clearer and more reliable.

### A1. Product Discovery

- Improve product listing filters and sort.
- Add active filter chips.
- Add empty search suggestions.
- Make product cards consistent.
- Surface store name and rating where useful.

### A2. Product Detail Trust

- Add seller/store trust card.
- Move return policy near Add to cart.
- Show stock and delivery messaging clearly.
- Add related products / recently viewed shelf.

### A3. Cart Clarity

- Group items by store if needed.
- Show coupon validation reason.
- Show price change/out-of-stock warnings.
- Keep price summary clear and sticky on desktop.

---

## Wave B — Checkout & Order Confidence

**Goal:** Reduce checkout drop-off and order anxiety.

### B1. Checkout Stepper

- Address → Payment → Review.
- Always show total.
- Validate address before payment.
- Keep COD/online options clear.

### B2. Order Detail Timeline

- Add timeline: Placed, Confirmed, Processing, Shipped, Delivered.
- Show payment status and invoice action.
- Show cancel/return eligibility.
- Add “Need help?” with order context.

### B3. Customer-Friendly Status Copy

- Convert backend statuses into simple customer messages.
- Use consistent status colors.
- Add next-step text.

---

## Wave C — Retention & Notifications

**Goal:** Bring customers back with useful reminders.

### C1. Persisted Customer Notifications

- Reuse Notification model for `customer`.
- Events: order update, payment update, support reply, coupon, wishlist price drop.
- Add header bell.
- Add full notification page.

### C2. Wishlist Upgrade

- Price drop labels.
- Back-in-stock alerts.
- Move to cart.
- Group by category.

### C3. Recently Viewed / Continue Shopping

- Persist locally first.
- Sync to account later.
- Use on home and product detail.

---

## Wave D — Support, Returns, Refunds

**Goal:** Make issues manageable without admin manually debugging everything.

### D1. Contextual Support

- Product page support starts product thread.
- Order page support starts order thread.
- Show unread replies.
- Link support thread from notifications.

### D2. Return Workflow

- Return reason form.
- Eligibility window.
- Vendor/admin review state.
- Customer timeline.
- Refund status tied to payment.

### D3. Help Center

- FAQ pages for payment, delivery, cancellation, returns.
- “Still need help?” opens support with context.

---

## Wave E — Personalization & Growth

**Goal:** Make the app better for repeat users.

### E1. Personalized Home

- Recently viewed.
- Recommended categories.
- Wishlist reminders.
- Coupons relevant to customer behavior.
- Reorder suggestions.

### E2. Smart Search

- Autocomplete.
- Typo tolerance.
- Search suggestions.
- Popular searches.
- Personalized result ranking later.

### E3. Loyalty Features

- Follow store.
- Store announcements.
- Category deal alerts.
- Customer segments for targeted coupons.

---

## Implementation Order

1. Product list filters + empty states.
2. Product detail trust card.
3. Checkout stepper.
4. Order detail timeline.
5. Customer persisted notifications.
6. Wishlist price/drop stock alerts.
7. Contextual support from order/product.
8. Return/refund workflow.
9. Reorder and personalized home.
10. Search autocomplete.

---

## Acceptance Checklist

Before calling the customer portal “good,” a test customer should be able to:

- Find a product in under 30 seconds.
- Understand price, stock, delivery, and return policy before buying.
- Place an order without confusion.
- Know exactly where the order is.
- Download invoice.
- Cancel/return when eligible.
- Ask for support from the right order/product.
- Save items and come back later.
- Receive useful notifications without noise.

