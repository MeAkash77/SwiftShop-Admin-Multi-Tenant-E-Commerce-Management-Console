# Admin UI / UX — Marketplace Control Plane

**Model:** Marketplace **operator console** (Amazon-style ops + calm Shopify Admin density), not a seller store admin.  
**Also see:** [SYSTEM-DESIGN](./SYSTEM-DESIGN.md) · [ACCESS-MATRIX](./ACCESS-MATRIX.md) · [PLANNING](./PLANNING.md)

Vendor Hub = Shopify-plain for **one store**.  
Admin panel = **Control Plane** for **all stores + all customers**.

---

## 1. What this panel is

| Do (Control Plane) | Don’t |
|--------------------|--------|
| Home = **queues + needs attention** | Home = only decorative charts |
| Global search (order #, email, store, SKU) | Hunt through 12 menus for one order |
| **Record pages** (Customer 360, Vendor 360, Order) | Flat tables with no detail |
| High-frequency actions as primary buttons | Hide Suspend behind nested menus |
| Confirm + reason on danger actions | One-click delete with no undo story |
| Neutral ops chrome (gray / white) | Same green “seller” branding as Vendor Hub |
| Clear “you are Admin” identity | Look like the customer shop |

**North star:** *Find the person or order → see context → take one safe action → leave an audit trail.*

---

## 2. Visual language

| Token | Choice |
|-------|--------|
| Surface | Light gray app bg `#F6F6F7`, white panels |
| Nav | White left rail, hairline borders |
| Accent | Deep slate / ink blue (ops), **not** vendor green `#008060` |
| Danger | Red for Suspend / Delete only |
| Type | Same system font stack as admin today; short labels |
| Density | Tables first; cards only for KPI strip on Home |
| Status | Text pills (Active, Suspended, Pending) |

Keep it plain — closer to Shopify Admin **layout** than to a marketing dashboard.

---

## 3. Information architecture (target nav)

```text
Home
Search                    ← global (or always in top bar)

People
  · Customers
  · Vendors
  · All users

Vendors
  · Stores
  · Approvals queue        ← pending / flagged

Catalog
  · Products
  · Categories
  · Inventory
  · Stock alerts

Commerce
  · Orders
  · Payments
  · Sales
  · Coupons

Trust
  · Reviews
  · Support inbox          ← mediation (planned)
  · Reports / abuse        ← planned

Content
  · Home marketing

Insights
  · Dashboard (or merge into Home)
  · Reports

Settings
  · Admins
  · Platform (planned)
  · Profile / Password
```

**MVP map (today → target):** keep existing routes; rename/group toward this IA; add record pages and queues first.

| Today | Target |
|-------|--------|
| Dashboard | Home (queues + KPIs) |
| Customers / All Users | People → Customers / All users |
| Stores | Vendors → Stores + Approvals |
| Products…Alerts | Catalog (same) |
| Orders…Coupons | Commerce (same) |
| Reviews / Marketing | Trust + Content |
| Reports | Insights |
| Settings | Settings |

---

## 4. Home (operator Home)

Not a vanity dashboard. Top of page:

### 4.1 Needs attention (queues)

| Queue card | Count | Primary action |
|------------|-------|----------------|
| Pending store approvals | n | Review |
| Low stock (platform) | n | Open alerts |
| Orders stuck (Pending &gt; N days) | n | Open orders |
| Refund / payment issues | n | Open payments |
| Flagged reviews | n | Open reviews |

### 4.2 Today strip

Users · Orders today · Sales today · Active stores · Active products

### 4.3 Secondary

7-day sparkline / small chart — **below** queues.

---

## 5. Global search (must-have UX)

Top bar search, placeholder: `Search orders, customers, vendors, products…`

Results groups:

- Orders (orderNumber)  
- Customers (email / name)  
- Vendors / Stores (store name / email)  
- Products (name / SKU)

Enter → open the **record page**.

---

## 6. Record pages (heart of admin UX)

### 6.1 Customer 360 — `/admin/customers/:id`

**Header:** Name · email · phone · Active/Suspended · Joined  
**Primary actions:** Deactivate | Send reset (planned) | Add note  

**Tabs:**

| Tab | Content |
|-----|---------|
| Overview | Flags, notes, last login |
| Orders | Table → open order |
| Addresses | List |
| Activity | Planned audit / support |

### 6.2 Vendor / Store 360 — `/admin/stores/:id` (or `/admin/vendors/:id`)

**Header:** Store name · vendor email · Active/Suspended/Pending  
**KPIs:** GMV · Orders · Rating · Dispute rate · Product count  

**Primary actions:** Approve | Suspend (reason) | Reinstate | View as catalog  

**Tabs:** Overview · Products · Orders · Payouts (planned) · Documents (planned)

### 6.3 Order detail — `/admin/orders/:id` (enhance list → detail)

**Header:** Order # · status · store · customer  
**Actions:** Change status · Mark payment · Invoice · Delete (danger)  
**Body:** Line items · amounts · timeline · internal notes (planned)

---

## 7. List patterns (every table)

| Pattern | Rule |
|---------|------|
| Filters | Status, date, store, search |
| Columns | Split multi-value cells (same lesson as vendor tables) |
| Row click | Opens record (not only icon buttons) |
| Bulk | Select + bulk deactivate (wave 2) |
| Empty | One sentence + link to related queue |

**Actions column:** primary text button + “More” for rare/danger — avoid crowding.

---

## 8. Danger & reason modals

Suspend / Delete / Refund always:

1. Modal title states consequence  
2. Required **reason** (suspend / reject)  
3. Confirm button labeled with verb (“Suspend store”)  
4. (Target) Write **AuditLog**

---

## 9. Key screens checklist

| Screen | Purpose | Priority |
|--------|---------|----------|
| Home + queues | Daily ops start | P0 |
| Global search | Speed | P0 |
| Customer 360 | Manage buyers | P0 |
| Store / Vendor 360 | Manage sellers | P0 |
| Orders list + detail | Commerce truth | P0 (detail P1) |
| Products list | Quality | P0 (exists) |
| Approvals queue | Onboarding | P1 |
| Payments / Sales | Money | P0 (exists) |
| Reviews / Marketing / Coupons | Trust & content | P0 (exists) |
| Reports export | Finance | P1 |
| Support inbox | Mediation | P2 |
| Platform settings | Fees / policies | P2 |
| Audit log | Governance | P1 |
| Admin Settings (accounts) | Access | P0 (exists) |

---

## 10. Motion & feedback

| Moment | Feedback |
|--------|----------|
| Suspend success | Toast + status pill updates |
| Failed API | Inline error on modal |
| Queue item resolved | Count decrements; row leaves queue |
| Search | Debounced; keyboard ↑↓ Enter |

Avoid celebratory animation — ops tool, not marketing site.

---

## 11. Mobile

Admin is **desktop-first**. Acceptable: readable tables + drawer filters on tablet. Do not block shipping on mobile-perfect admin.

---

## 12. Alignment with Vendor Shopify-plain

| Vendor | Admin |
|--------|-------|
| Green primary `#008060` | Ink / slate primary |
| “Home = seller tasks” | “Home = platform queues” |
| One store tables | Cross-tenant tables + 360 records |
| Media library for seller | Optional platform media later |

Shared: plain surfaces, left nav, tables, status pills, confirm on delete.

---

## Related

- [SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md)  
- [ACCESS-MATRIX.md](./ACCESS-MATRIX.md)  
- [SERVICES-CATALOG.md](./SERVICES-CATALOG.md)  
- [PLANNING.md](./PLANNING.md)  
- Vendor visual: [../vendor/UI-UX-SHOPIFY-PLAIN.md](../vendor/UI-UX-SHOPIFY-PLAIN.md)  
