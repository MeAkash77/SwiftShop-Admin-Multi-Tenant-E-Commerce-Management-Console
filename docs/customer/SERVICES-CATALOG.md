# Customer Services Catalog

Status legend:

- **Have** — already exists in the app
- **Partial** — exists but needs stronger UX/system support
- **Missing** — should be planned

---

## 1. Discovery

| Service | Status | Notes |
|---------|--------|-------|
| Home storefront | Have | Needs more personalized returning-customer shelves |
| Category browsing | Have | Improve category landing pages |
| Product listing | Have | Filters/sort should be stronger |
| Search | Partial | Needs autocomplete, typo tolerance, suggestions |
| Product detail | Have | Add stronger trust, delivery, seller policy blocks |
| Recently viewed | Partial | Exists in frontend areas; formalize as customer service |
| Recommendations | Missing | Use category/order/wishlist behavior later |

---

## 2. Buying

| Service | Status | Notes |
|---------|--------|-------|
| Cart | Have | Could be persisted server-side |
| Quantity management | Have | Revalidate stock at checkout |
| Coupons | Have | Improve coupon discovery and failure reasons |
| Address book | Have | Add autocomplete later |
| Checkout | Have | Needs clearer progress steps and price summary |
| COD payment | Have | Keep clear payment status messaging |
| Online payment | Have | Razorpay flow exists |
| Saved payment methods | Missing | Only through gateway tokenization, not card storage |
| Buy Now | Missing | Useful for fast repeat shopping |

---

## 3. Post-Purchase

| Service | Status | Notes |
|---------|--------|-------|
| Order history | Have | Needs stronger order detail/timeline UI |
| Order status | Have | Use customer-friendly labels |
| Invoice download | Have | Surface consistently |
| Cancel order | Have | Keep eligibility clear |
| Return order | Partial | Basic return status exists; needs real reason/workflow |
| Refund tracking | Partial | Tie payment/refund status into order timeline |
| Reorder | Missing | High-value repeat customer feature |
| Delivery tracking | Missing | Needs shipment/carrier model or manual tracking fields |

---

## 4. Retention

| Service | Status | Notes |
|---------|--------|-------|
| Wishlist | Have/Partial | Improve price-drop/back-in-stock actions |
| Reviews | Have | Add post-delivery prompt and moderation flow |
| Account notifications | Partial | Current customer page derives from orders; should use persisted model |
| Personalized coupons | Missing | Based on category/order/wishlist |
| Follow store | Missing | Useful for marketplace loyalty |
| Back-in-stock alert | Missing | Linked to wishlist/stock events |
| Price-drop alert | Missing | Linked to wishlist/product price changes |

---

## 5. Support & Trust

| Service | Status | Notes |
|---------|--------|-------|
| Customer support chat | Have | Add stronger entry points from order/product |
| Product questions | Partial | Chat product requests exist; improve customer-facing flow |
| Store trust card | Partial | Show seller, policy, ratings |
| Return policy | Partial | Present near product and order actions |
| Payment safety copy | Missing | Add checkout trust strip |
| Abuse/report product | Missing | Needed for marketplace trust |
| Help center / FAQ | Missing | Reduce support load |

---

## 6. Priority Summary

### Highest Customer Value

1. Better product search/filter/sort.
2. Order detail timeline.
3. Persisted customer notifications.
4. Wishlist price-drop/back-in-stock.
5. Simplified checkout progress.
6. Return/refund workflow.
7. Contextual support from product/order.

### Highest Business Value

1. Reduced checkout drop-off.
2. Increased repeat purchases via wishlist/reorder.
3. Better trust via reviews/store policy.
4. Lower support volume through clear order tracking.
5. Higher conversion via search and filters.

