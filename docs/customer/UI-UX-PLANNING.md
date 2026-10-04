# Customer UI / UX Planning

**Model:** Amazon for frequent-user personalization, Flipkart for simple mobile-first browsing, Shopify storefronts for clean product detail and checkout clarity.

Customer UI should feel like a **fast shopping app**, not an admin dashboard.

---

## 1. Experience North Star

**Search fast → compare confidently → checkout clearly → track calmly → resolve problems easily.**

Most customers are not exploring the system. They are trying to complete one of these jobs:

- “I know what I want. Let me search and buy.”
- “I am comparing options. Help me filter.”
- “I saved something. Tell me if the price or stock changed.”
- “Where is my order?”
- “I need to cancel, return, or ask for help.”

---

## 2. Everyday Platform Examples

| Platform Pattern | What Customers Like | MultiCommerce Takeaway |
|------------------|---------------------|------------------------|
| Amazon home | Personalized shelves, reorder, saved addresses | Home should adapt after login |
| Amazon search | Predictive search, remembered filters, fast buying path | Search bar must be primary |
| Flipkart home | Bigger category icons, simpler mobile browsing | Keep categories visible and clear |
| Flipkart checkout | Step-by-step address/payment flow | Show progress and final price early |
| Myntra/fashion apps | Wishlist, size reminders, style shelves | Wishlist should be active, not passive |
| Grocery apps | Reorder, delivery slot, substitutions | Useful for repeat product patterns |
| Shopify storefronts | Clean product detail, trust blocks, simple cart | Avoid overloaded product pages |

---

## 3. Information Architecture

```text
Home
Search
Categories
Stores
Product detail
Cart
Checkout

Account
  · Profile
  · Addresses
  · Orders
  · Wishlist
  · Coupons
  · Notifications
  · Reviews
  · Support
```

### Navigation Rules

1. Search is always visible on customer storefront.
2. Cart is always one tap away.
3. Account pages are grouped around “my activity.”
4. Orders and support are linked everywhere after purchase.
5. Vendor/admin labels never appear in customer UI.

---

## 4. Home Page

### First-Time Customer

```text
Header: Search + cart + account
Hero: Value proposition / sale banner
Category strip
Popular products
New stores
Trust strip: secure payment, easy returns, support
```

### Returning Customer

```text
Continue shopping
Recently viewed
Wishlist reminders
Recommended for you
Coupons you can use
Orders in progress
Categories you visit often
```

### UX Rules

- Do not make the home page only banners.
- Keep the first product shelf visible without too much scrolling.
- Show “resume” modules only when there is real data.
- Avoid aggressive popups on first visit.

---

## 5. Search & Discovery

Search is the highest-intent customer action.

### Target Features

| Feature | Why |
|---------|-----|
| Autocomplete | Faster product discovery |
| Recent searches | Helps repeat users |
| Category suggestions | Helps vague searches |
| Typo tolerance | Prevents dead ends |
| Filter chips | Makes filtering visible |
| Sort by relevance, price, newest | Common ecommerce expectation |
| Delivery / stock filter | Prevents disappointment |
| Store filter | Useful in marketplace model |

### Empty Search State

```text
No exact match for "iphon cabel"
Did you mean "iphone cable"?
Try:
  · Phone accessories
  · Charging cables
  · Electronics
```

---

## 6. Product Listing Page

### Product Card Must Show

- Image
- Product name
- Price and discount
- Rating/review count
- Stock or delivery signal
- Store/seller name when useful
- Wishlist button
- Add to cart / quick view where appropriate

### Layout

```text
Filters sidebar / drawer
Sort control
Product grid
Pagination / infinite load
Recently viewed strip
```

### Rules

- Mobile filters open as a drawer.
- Desktop filters stay left.
- Active filters appear as removable chips.
- Product cards should be consistent height.

---

## 7. Product Detail Page

### Above The Fold

```text
Image gallery
Title
Price / discount
Rating
Variant selector
Stock status
Delivery estimate / pincode
Add to cart
Buy now
Wishlist
```

### Below The Fold

- Store card: sold by, rating, return policy
- Description
- Specifications
- Reviews
- Related products
- Recently viewed
- Ask seller / support

### Trust Rules

- Always show final price.
- Show return policy near buying buttons.
- Show stock clearly.
- If out of stock, offer wishlist / notify me.
- If variant is required, block add-to-cart until selected.

---

## 8. Cart

### Cart Jobs

- Review items
- Change quantity
- Remove / save for later
- Apply coupon
- See delivery and total
- Move to checkout

### Cart Structure

```text
Items grouped by store (if needed)
Quantity controls
Coupon preview
Price summary
Delivery summary
Checkout button
```

### Stuck Points

| Stuck Point | UI Fix |
|-------------|--------|
| Item out of stock | Inline warning + remove/save |
| Price changed | Highlight old/new price |
| Coupon invalid | Explain reason |
| Multiple stores | Group items with store names |

---

## 9. Checkout

Checkout should feel like a short, safe path.

```text
Step 1: Address
Step 2: Payment
Step 3: Review & place order
```

### UX Rules

- Show progress steps.
- Keep price summary visible.
- Validate address before payment.
- Show estimated delivery before final place order.
- Support COD and online payment clearly.
- After placing order, show confirmation immediately.

### Future Improvements

- Address autocomplete.
- Saved payment methods through gateway tokens.
- One-tap checkout for returning customers.
- Buy Now path from product detail.

---

## 10. Orders & Tracking

Order page should answer: **What happened? What next? Can I act?**

### Order List Card

- Order number
- Date
- Store
- Total
- Order status
- Payment status
- Primary action: Track / View details
- Secondary: Invoice, Cancel, Return, Support

### Order Detail

```text
Timeline:
Placed → Confirmed → Processing → Shipped → Delivered

Summary:
Items, address, payment, invoice, support
```

### Status Copy

| Status | Customer Message |
|--------|------------------|
| Pending | We received your order |
| Confirmed | Seller confirmed your order |
| Processing | Seller is preparing your order |
| Shipped | Your order is on the way |
| Delivered | Delivered |
| Cancelled | Order cancelled |
| Returned | Return completed / in progress |

---

## 11. Wishlist

Wishlist should help customers return and buy later.

### Features

- Save product from card/detail/cart.
- Show price drop badge.
- Show back-in-stock alert.
- Move to cart.
- Remove.
- Group by category.

### Notifications

- “Wishlist item is back in stock.”
- “Price dropped on a saved item.”
- “Only 2 left in stock.”

---

## 12. Notifications

Customer notifications should be separate from toast messages.

### Notification Types

- Order status updates
- Payment status updates
- Delivery / return changes
- Support replies
- Wishlist price drop / back in stock
- Coupon expiring soon
- Store announcement if customer follows a store

### UI

```text
Bell in header
Unread count
Dropdown preview
Full notifications page
Mark read / mark all read
Deep link to order/product/support
```

---

## 13. Support

Support should start with context.

| Entry Point | Context Attached |
|-------------|------------------|
| Product page | product + store |
| Order detail | order + store + customer |
| Payment issue | order + payment status |
| Return issue | order + return reason |

### Support UI

- Chat thread list
- Unread badges
- Order/product preview
- Quick reasons: delivery, payment, return, product question
- Attach image later

---

## 14. Reviews

Reviews are post-purchase trust.

### Rules

- Only customers who bought can review.
- Ask after delivery.
- Allow rating + text + optional image later.
- Customer can edit own review.
- Admin can moderate abusive reviews.

---

## 15. Visual Language

| Area | Direction |
|------|-----------|
| Color | Customer storefront can be warmer and more retail-friendly than admin |
| Typography | Clear hierarchy, readable product names |
| Buttons | Primary = Add to cart / Buy / Checkout |
| Cards | Product cards consistent, not overloaded |
| Status | Text + color, never color-only |
| Mobile | Bottom nav or compact header for core actions |

---

## 16. Mobile UX

Most ecommerce browsing is mobile-first.

Target mobile structure:

```text
Top: search
Bottom nav: Home · Categories · Wishlist · Cart · Account
Filters: bottom sheet / drawer
Product detail: sticky Add to cart / Buy now
Checkout: single-column steps
```

---

## 17. Customer Stuck Points

| Problem | Fix |
|---------|-----|
| Search gives nothing | Suggestions + corrected query |
| Too many products | Better filters + sorting |
| Price uncertainty | Clear totals before checkout |
| Coupon confusion | Explain why coupon failed |
| Payment failed | Retry + switch payment method |
| Order delay | Timeline + support action |
| Return unclear | Eligibility + simple reason form |
| Out of stock | Notify me / wishlist |

