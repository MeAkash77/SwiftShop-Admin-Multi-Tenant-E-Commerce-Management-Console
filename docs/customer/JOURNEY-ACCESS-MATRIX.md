# Customer Journey & Access Matrix

This document maps what customers need at every stage, what they can access, where they get stuck, and what the system should expose.

---

## 1. Journey Map

| Stage | Customer Goal | Product Surfaces | Success Signal |
|-------|---------------|------------------|----------------|
| Arrive | Understand what can be bought | Home, categories, banners | Customer clicks category/search/product |
| Discover | Find relevant products | Search, filters, product listing | Product detail opened |
| Evaluate | Trust price, seller, quality | Product detail, reviews, store card | Add to cart / wishlist |
| Decide | Compare final price and delivery | Cart, coupon, delivery estimate | Checkout started |
| Checkout | Place order safely | Address, payment, review order | Order created |
| Track | Know order progress | Orders, notification, email | Customer does not need support |
| Resolve | Cancel/return/get help | Order detail, support chat | Issue closed |
| Repeat | Buy again or continue shopping | Wishlist, reorder, recently viewed | Repeat purchase |

---

## 2. Access Matrix

| Area | Guest | Logged-in Customer |
|------|-------|--------------------|
| Home | View | Personalized view |
| Product list | View/search/filter | View/search/filter + recently viewed |
| Product detail | View | View + wishlist + support |
| Cart | Local cart | Persistent cart planned |
| Checkout | Prompt login/register | Place order |
| Address | No access | Create/update/delete own addresses |
| Orders | No access | Own orders only |
| Invoice | No access | Own invoices only |
| Wishlist | Local prompt | Own wishlist |
| Coupons | Public active coupons | Personalized eligible coupons planned |
| Reviews | Read | Read + write after purchase |
| Support | Product question prompt | Own support threads |
| Notifications | No access | Own notifications |
| Profile | No access | Own profile/password |

---

## 3. Customer Actions

| Action | Allowed When | Guardrail |
|--------|--------------|-----------|
| Add to cart | Product active and in stock | Validate stock again at checkout |
| Buy now | Product active and in stock | Requires address/payment |
| Apply coupon | Coupon active and eligible | Show exact failure reason |
| Place order | Logged in, valid address, valid cart | Server recalculates totals |
| Pay online | Order payment pending | Server verifies gateway signature |
| Cancel order | Pending/Confirmed only | Restore stock |
| Return order | Delivered only | Return window rules planned |
| Download invoice | Own paid/delivered eligible order | Ownership check |
| Review product | Purchased and delivered | One review per product/order |
| Contact support | Logged in | Attach order/product context |
| Mark notification read | Own notification | Recipient check |

---

## 4. Stuck-Point Matrix

| Stuck Point | Detection | Customer UI | Backend/System |
|-------------|-----------|-------------|----------------|
| Search miss | No products | Suggestions, categories | Search index later |
| Product out of stock | `stock <= 0` | Notify me / wishlist | Notification event later |
| Cart stock changed | Checkout validation | Inline warning | Re-price/revalidate server-side |
| Coupon failed | Validation error | Reason text | Coupon rules API |
| Payment failed | Gateway verify fails | Retry/switch method | Payment status update |
| Order delayed | Status unchanged too long | “Need help?” action | Admin/vendor queue later |
| Vendor cancelled | Order status change | Notification + refund info | Order event |
| Return rejected | Return status | Reason + support link | Return workflow planned |
| Support unread | New message | Badge + notification | Chat unread count |

---

## 5. Data Visibility Rules

| Data | Customer Can See | Customer Cannot See |
|------|------------------|---------------------|
| Product | Active product details | Draft/inactive products |
| Store | Public store name/contact policy | Vendor private details |
| Order | Own order and items | Other customers’ orders |
| Payment | Own payment status/reference | Platform settlement/payout |
| Address | Own saved addresses | Vendor/customer addresses unrelated |
| Review | Public reviews + own review | Moderation notes |
| Support | Own threads | Vendor/admin internal notes |
| Notification | Own notification | Admin/vendor notifications |

---

## 6. Customer Roles

For now all customers share one role: `customer`.

Future segmentation can be product behavior, not RBAC:

- New visitor
- Logged-in first-time buyer
- Repeat buyer
- High-value customer
- At-risk customer with failed payment/return issue
- Deal seeker / wishlist-heavy user

These segments should affect recommendations and notifications, not access to private data.

