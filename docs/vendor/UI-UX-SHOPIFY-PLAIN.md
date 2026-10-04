# Vendor UI / UX — Shopify-plain plan

**Model:** [Shopify Admin](https://www.shopify.com/admin) seller experience — plain, calm, job-first.  
**Also see:** [SERVICES-CATALOG](./SERVICES-CATALOG.md) · [SYSTEM-DESIGN](./SYSTEM-DESIGN.md) · [PLANNING](./PLANNING.md)

MultiCommerce Vendor Hub should feel like a **simple store admin**, not a flashy dashboard.

---

## 1. What “Shopify-plain” means

| Do (Shopify-like) | Don’t |
|-------------------|--------|
| White / light gray surfaces | Loud gradients, glass blur, neon accents |
| Left nav with short labels | Long group names and icon noise |
| **Home** = today’s work | Home = only charts |
| One clear primary button (green/teal) | Many equal CTAs |
| Tables + filters for daily work | Card grids for everything |
| Short copy (“Orders”, “Add product”) | Marketing blurbs in the sidebar |
| Empty state + one button | Empty dead pages |
| Status pills with text | Color-only status |

**North star:** *See what needs doing → open it → finish it.*

---

## 2. Shopify Admin → our map

| Shopify Admin | MultiCommerce Vendor | Notes |
|---------------|----------------------|--------|
| **Home** | `/vendor` | Tasks first, stats second |
| **Orders** | `/vendor/orders` | Top of nav; status filters |
| **Products** | Listings + Add product | Shopify: Products list; “Add product” is CTA |
| **Inventory** | `/vendor/inventory` + alerts | Under Products |
| **Discounts** | `/vendor/coupons` | Same idea |
| **Online Store / content** | `/vendor/marketing` | Banners ≈ simple store content |
| **Settings** | Store, shipping, profile, theme | Group under Settings / Store |
| Customers / Apps / Analytics deep | Skip or light | One-store MVP; charts light on Home |
| Payments / Payouts | `/vendor/payments` | Label **Customer payments** until real payouts |
| Inbox | `/vendor/support` | Keep simple thread list |

---

## 3. Plain navigation (target)

```text
Home
Orders
Products
  · All products
  · Add product
  · Inventory
  · Low stock
Discounts          → Coupons
Store
  · Store details
  · Shipping
Marketing          → Home banners
Inbox              → Customer support
Reviews
Settings
  · Appearance
  · Profile
  · Password
```

**Rules (Shopify-like):**
1. **Orders** sits under Home (most used).  
2. Labels are 1–2 words.  
3. No “Engagement” / “Sales” umbrella if it hides Orders.  
4. One store — no store switcher.

---

## 4. Home (Shopify Home)

```text
Title: Home
Subtitle: Here’s what needs your attention

[ Needs attention ]
  · X orders to fulfill     → Orders
  · Y low-stock items       → Low stock
  · Z open chats            → Inbox
  · Setup: create store…    → (if incomplete)

[ At a glance ]
  Products · Orders · Paid revenue · Stock

[ Optional charts below ]
```

Setup checklist (plain):
1. Create store  
2. Set shipping  
3. Add a product  
4. Share storefront link  

---

## 5. Core screens (plain flows)

### Orders
- Filters/tabs: All, Pending, Confirmed, Processing, Shipped, Delivered  
- Row: order #, date, total, payment, status, **Update**  
- Later: order detail page + “Mark as shipped” + tracking (like Shopify fulfill)

### Products
- **All products** = default list (search, status filter, bulk)  
- **Add product** = wizard CTA (top right)  
- Publish = Active · Draft = Inactive  

### Inventory
- Plain table: product, SKU, stock, edit  
- Low stock = filtered list + threshold later  

### Discounts / Marketing / Inbox
- One form + one list per page  
- No extra widgets  

### Payments
- Copy: “Customer payment status (COD / online)”  
- Do **not** say “Payouts” until Wave C  

---

## 6. Visual system (plain)

| Token | Shopify-plain choice |
|-------|----------------------|
| Page bg | `#f1f2f4` / `#f6f6f7` |
| Surface | `#ffffff` |
| Border | `#e1e3e5` |
| Text | `#202223` |
| Muted | `#6d7175` |
| Primary | `#008060` (Shopify green) or close `#0f766e` |
| Radius | 8–10px (not large soft cards) |
| Font | System / Inter-like — readable, not display |
| Shadow | None or 1px border; avoid heavy glow |

Light theme default. Dark optional, still plain (no neon).

---

## 7. Microcopy (plain)

| Instead of | Use |
|------------|-----|
| Vendor dashboard | Home |
| Running {store} — track catalog… | Store: {name} |
| Quick actions | Shortcuts |
| Review settlements and payouts | Customer payments |
| New product | Add product |
| Vendor workspace | Admin |

---

## 8. Build phases

### Phase 1–2 — Done in app

- Plain shell (gray / white / `#008060`)
- Shopify-like nav labels
- Home needs-attention + setup checklist
- Orders status tabs + primary fulfill actions
- Products / Inventory / Store / Shipping / Payments / Discounts / Marketing plain headers
- Seller login plain card

### Phase 3 — With feature waves
- Ship + tracking modal (Wave A)  
- Inline stock (Wave B)  
- Real Payouts page (Wave C) — separate from Payments  

---

## 9. Check vs Shopify (acceptance)

| Check | Pass when |
|-------|-----------|
| First glance | Looks calm; white content on gray; green primary |
| Home | Tasks visible without scrolling past charts |
| Nav | Orders near top; short names |
| Orders | Filter by status in ≤1 click |
| New seller | Told next step if store/product missing |
| Words | No fake “payouts” |

---

## 10. Out of scope

Apps store, multi-channel, customer CRM, complex analytics, ad manager, purple/glow “AI” skins.

---

## Related

[UI-UX history / wider hubs](./UI-UX-PLANNING.md) kept for extra detail · this file is the **Shopify-plain source of truth** for Seller Hub look & flow.
