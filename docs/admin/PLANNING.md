# Admin Planning Roadmap

**Audience:** product & engineering  
**Inputs:** [SERVICES-CATALOG](./SERVICES-CATALOG.md) · [ACCESS-MATRIX](./ACCESS-MATRIX.md) · [UI-UX-PLANNING](./UI-UX-PLANNING.md) · [SYSTEM-DESIGN](./SYSTEM-DESIGN.md)

Goal: turn today’s **table-heavy Super Admin** into a **Marketplace Control Plane** that can truly manage **customers** and **vendors**.

---

## Wave 0 — Stabilize (done / keep)

- [x] Admin portal auth isolation  
- [x] Portal-scoped refresh cookies (multi-port safe)  
- [x] Dashboard, users, stores, products, orders, payments, categories, coupons, banners, reviews  
- [x] Operator user guide  

---

## Wave A — Find & understand (P0)

**Outcome:** Admin can find any customer/vendor/order in seconds and see full context.

| Item | Access unlocked |
|------|-----------------|
| Global search (top bar) | Cross-entity find |
| Customer 360 page | Profile + orders + addresses |
| Store / Vendor 360 page | KPIs + products + orders |
| Order detail page | Timeline + actions |
| Home “Needs attention” strip | Queues entry points |

**Exit:** Support can resolve “where is my order?” without leaving admin.

---

## Wave B — Govern people (P0–P1)

| Item | Access unlocked |
|------|-----------------|
| Suspend store / user **with reason** modal | Trust actions |
| Pending store **Approvals queue** | Vendor onboarding |
| Customer flags + internal notes | Care history |
| Delete user UI (confirm + audit) | Danger path |
| Email notify on suspend/approve (optional) | Fair process |

**Exit:** Vendor lifecycle = Pending → Approved → Suspended → Active.

---

## Wave C — Trust & catalog quality (P1)

| Item | Access unlocked |
|------|-----------------|
| Bulk deactivate products | Bad listing cleanup |
| Category full edit UI | Catalog structure |
| Reviews queue filters (flagged) | Moderation speed |
| Admin media / image remove | Abuse images |
| Chat mediation inbox | Support bridge |

---

## Wave D — Money & reports (P1–P2)

| Item | Access unlocked |
|------|-----------------|
| Payment issue queue | Stuck money |
| CSV export (orders, sales, users) | Finance |
| Date-range reports | Insights |
| Commission rules (schema + UI) | Marketplace take rate |
| Payout runs + hold on suspend | Seller settlement |

---

## Wave E — Platform & RBAC (P2)

| Item | Access unlocked |
|------|-----------------|
| Audit log for all Act/Danger | Governance |
| Roles: Support / Trust / Finance | Least privilege |
| Platform settings (fees, policies) | Config |
| Feature flags | Safe rollout |

---

## Suggested build order (next 4 slices)

1. **Global search + Customer 360**  
2. **Store 360 + Suspend with reason**  
3. **Home queues + Approvals**  
4. **Audit log + Order detail**

Each slice: API → UI → update SERVICES-CATALOG + ACCESS-MATRIX statuses.

---

## Definition of done (Control Plane MVP)

- [ ] Admin finds customer or order via search  
- [ ] Customer 360 and Store 360 exist  
- [ ] Suspend/approve with reason  
- [ ] Home shows at least 3 live queues  
- [ ] Dangerous actions confirmed; (wave E) audited  
- [ ] Docs catalog statuses updated  

---

## Related

- Operator how-to: [../user-guides/ADMIN.md](../user-guides/ADMIN.md)  
- Vendor side stays: [../vendor/README.md](../vendor/README.md)  
