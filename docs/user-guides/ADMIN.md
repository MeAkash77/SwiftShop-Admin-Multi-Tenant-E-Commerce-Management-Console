# Super Admin User Guide

Operate the MultiCommerce platform: users, catalog, orders, and analytics.

**Portal:** [Admin login](https://multicommerce-web.vercel.app/admin/login) · First-time setup: [/admin/setup](https://multicommerce-web.vercel.app/admin/setup)

---

## 1. First admin (bootstrap)

1. Open **Admin setup** (only needed once).  
2. Create Super Admin with the configured **setup secret** (`ADMIN_SETUP_SECRET` on the API).  
3. Login at `/admin/login`.  
4. Later admins can be created from the admin auth APIs / users tools as allowed by your deployment.

Use **only** the admin login URL (not customer or vendor login).

---

## 2. Dashboard

**Dashboard** shows platform-wide:

- Users, orders, stock, sales, stores, products  
- Today’s orders / sales  
- 7-day sales chart and daily report table  

Use this to spot spikes, drops, or fulfillment backlog.

---

## 3. People

| Menu | Actions |
|------|---------|
| All Users | View vendors & customers; activate / deactivate; remove if needed |
| Customers | Focused customer list / oversight |

Deactivating a user should block normal login when `isActive` is false.

---

## 4. Catalog & stores

| Menu | Actions |
|------|---------|
| Stores | List all vendor stores; review / intervene |
| Products | Browse all products; adjust or remove problematic listings |
| Categories | Create/update categories used by vendors |
| Inventory | Stock overview across the platform |
| Low Stock Alerts | Spot SKUs that need restock by sellers |

Prefer fixing data quality issues with vendors when possible; use delete for clear policy violations.

---

## 5. Sales & money

| Menu | Actions |
|------|---------|
| Orders | Search, change status, delete if necessary, download invoice when Delivered |
| Payments | Oversight of payment statuses |
| Sales | Revenue breakdowns |
| Coupons | Platform-wide or store-scoped coupon tools |
| Reports | Export-style reporting views |

Status rules match vendor fulfillment:

```text
Pending → Confirmed → Processing → Shipped → Delivered
              ↘ Cancelled
Delivered → Returned
```

Invoice PDF is available for **Delivered** orders only.

---

## 6. Engagement & content

| Menu | Actions |
|------|---------|
| Reviews | Moderate / remove abusive reviews |
| Home Marketing | Platform-level banners on shop home |

---

## 7. Account & settings

- **Settings** — platform configuration screens available in the app  
- **Profile** — admin profile  
- **Change password** — rotate credentials regularly  
- **Logout** — always log out on shared machines  

---

## 8. Admin dos and don’ts

**Do**
- Protect the setup secret and admin passwords  
- Deactivate abusive or abandoned accounts  
- Use dashboard data before bulk deletions  
- Coordinate with vendors before removing their live catalog  

**Don’t**
- Share Super Admin credentials  
- Delete Delivered orders that need audit history without cause  
- Change order status backward without a business reason  
- Use customer/vendor portals for admin work  

---

## Daily ops checklist

- [ ] Open Dashboard — check today’s sales/orders  
- [ ] Orders — clear stuck Pending / Processing  
- [ ] Alerts — note low stock outliers  
- [ ] Reviews / Marketing — spot spam or broken banners  
- [ ] Users — resolve reported accounts  
