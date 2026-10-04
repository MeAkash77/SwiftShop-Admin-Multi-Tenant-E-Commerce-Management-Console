# 03 — Database Modules

MongoDB collections used by MultiCommerce (Mongoose models under `backend/models/`).

---

## 1. Entity relationship overview

```text
┌──────────┐ 1     1 ┌─────────┐ 1     * ┌──────────┐
│   User   │─────────│  Store  │─────────│ Product  │
│ (vendor) │ vendorId│         │ store   │          │
└──────────┘         └────┬────┘         └────┬─────┘
                          │                   │
                          │ 1                 │ *
                          │                   │
                     *┌───▼────┐         *┌───▼─────┐
                      │ Order  │──────────│OrderItem│
                      │storeId │ 1      * │productId│
                      └───┬────┘          └─────────┘
                          │
                     *┌───▼────┐
                      │  User  │ (customerId)
                      │customer│
                      └────────┘

User(customer) ──* Address
Product ──* Review ── User(customer)
Product ── Category
Banner ── Category / Store / User(createdBy)
Coupon ── Store? / User(createdBy)
```

**Auxiliary collections** (not on the core order graph):

```text
CatalogProduct  (admin-managed master template; vendors auto-fill listings)
Payout ── Store / User(vendor) / User(processedBy)
Notification ── User(recipient) / Store?
MediaAsset ── User(vendor) / Store?
ChatSession ── User(customer) / Store? / Order?  (embeds messages[])
```

---

## 2. Module: User (`userModel.js`)

**Collection:** `users`  
**Purpose:** All accounts (admin, vendor, customer).

| Field | Type | Notes |
|---|---|---|
| email | String | Unique login |
| password | String | Hashed |
| role | Enum | `superAdmin` \| `vendor` \| `customer` |
| firstName, lastName, phoneNumber | String | Profile |
| refreshToken | String | Stored for rotate/logout |
| passwordResetToken / Expires | String/Date | Reset flow |
| profileImage | Object | Cloudinary metadata |
| isEmailVerified / isPhoneVerified | Boolean | Gates |
| otp | Object | `{ code, type, expiresAt, attempts }` |
| isActive | Boolean | Admin can disable |
| lastLogin | Date | Analytics |
| tenantId | String | Reserved / indexed (future tenancy) |

**Indexes:** email unique; tenantId.

---

## 3. Module: Store (`storeModel.js`)

**Collection:** `stores`  
**Purpose:** Vendor shopfront profile & shipping defaults.

| Field | Type | Notes |
|---|---|---|
| storeName | String | Display name |
| description | String | About store |
| vendorId | ObjectId → User | **Unique** (1 store / vendor) |
| email, phone, address | Mixed | Contact |
| shippingFee | Number | Default fee |
| freeShippingAbove | Number | Threshold |
| shippingPolicy, returnPolicy | String | Text |
| estimatedDeliveryDays | Number | ETA |
| isActive | Boolean | Visibility |

---

## 4. Module: Category (`categoryModel.js`)

**Collection:** `categories`  
Used by products and marketing banners.

| Field | Type | Notes |
|---|---|---|
| name, slug | String | slug unique-ish |
| description | String | Optional |
| status | Boolean | Active flag |

---

## 5. Module: Product (`productModel.js`)

**Collection:** `products`  
Catalog unit sold by a vendor store.

| Field | Type | Notes |
|---|---|---|
| vendor | ObjectId → User | Owner |
| store | ObjectId → Store | Tenant scope |
| category | ObjectId → Category | Optional |
| name, slug, description, shortDescription | String | Marketing copy |
| aboutItems | [String] | Bullet points |
| productType | Enum | generic/mobile/laptop/… |
| specifications | [{label,value}] | Specs table |
| optionGroups | [{key,label,values}] | e.g. Color / Size |
| price, discountPrice | Number | MRP / sell |
| stock | Number | Base stock |
| sku, brand | String | Identity |
| images | [{url, public_id}] | Cloudinary |
| variants | [Variant] | Per-option stock/price |
| tags | [String] | Search |
| averageRating, totalReviews | Number | Denormalized |
| isFeatured | Boolean | Home highlight |
| status | Enum | `active` \| `inactive` |

**Indexes:** store+status, vendor, category, text on name/description/brand.

---

## 6. Module: Order + OrderItem (`orderModel.js`)

**Collections:** `orders`, `orderitems`

### Order

| Field | Type | Notes |
|---|---|---|
| orderNumber | String | Human id |
| customerId | ObjectId → User | Buyer |
| storeId | ObjectId → Store | Seller scope |
| shippingAddress | Object | Snapshot at checkout |
| subtotal, tax, shippingFee, discountAmount, totalAmount | Number | Server-priced (shipping from store; discount from coupon) |
| couponCode | String | Applied code snapshot |
| paymentStatus | String | Paid / Pending / … |
| paymentMethod | String | COD / UPI / … |
| paymentId, razorpayOrderId | String | Gateway ids |
| paidAt, paymentNote | Date/String | Audit |
| orderStatus | String | Fulfillment pipeline |

### OrderItem

| Field | Type | Notes |
|---|---|---|
| orderId | ObjectId → Order | Parent |
| productId | ObjectId → Product | Line product |
| quantity | Number | Qty |
| price | Number | Unit at purchase |
| variantOptions / variantLabel | Object/String | Chosen options |

---

## 6b. Module: Coupon (`couponModel.js`)

**Collection:** `coupons`

| Field | Type | Notes |
|---|---|---|
| code | String | Uppercase; unique per store (or platform when store is null) |
| type | Enum | `percent` \| `fixed` |
| value | Number | % or ₹ |
| minOrder | Number | Minimum merchandise subtotal |
| maxUses / usedCount | Number | Optional cap |
| store | ObjectId → Store | null = platform-wide |
| createdBy | ObjectId → User | Vendor or admin |
| startsAt / expiresAt | Date | Optional window |
| isActive | Boolean | Pause without delete |

---

## 7. Module: Address (`addressModel.js`)

**Collection:** `addresses`  
Customer shipping book.

| Field | Type | Notes |
|---|---|---|
| customer | ObjectId → User | Owner |
| fullName, phone, pincode, locality | String | Contact / locality |
| addressLine, city, state | String | Address |
| addressType | String | Home / Work |
| isDefault | Boolean | Preferred |

---

## 8. Module: Review (`reviewModel.js`)

**Collection:** `reviews`

| Field | Type | Notes |
|---|---|---|
| product | ObjectId → Product | Target |
| customer | ObjectId → User | Author |
| rating | Number | 1–5 |
| title, comment | String | Text |
| images | [Object] | Optional photos |

**Constraint:** unique `(product, customer)` — one review per user per product.

---

## 9. Module: Banner (`bannerModel.js`)

**Collection:** `banners`  
Home CMS (slider / offer / category tile).

| Field | Type | Notes |
|---|---|---|
| title, subtitle, badgeText | String | Copy |
| type | Enum | slider \| offer \| category |
| image | Object | Cloudinary |
| linkUrl | String | Deep link |
| category | ObjectId | Optional |
| store | ObjectId | Vendor banner scope |
| createdBy / creatorRole | Ref/String | Audit |
| sortOrder | Number | Display order |
| isActive | Boolean | Publish flag |
| startsAt / endsAt | Date | Schedule |

---

## 9b. Module: CatalogProduct (`catalogProductModel.js`)

**Collection:** `catalogproducts`  
Company-managed **master catalog** template (brand → product → models/specs). Vendors browse these and auto-fill their own listing; this is **not** a sellable product.

| Field | Type | Notes |
|---|---|---|
| brand | String | Indexed; grouped in `/catalog/brands` |
| name | String | Model/product name |
| category | ObjectId → Category | Optional |
| categorySlug | String | Denormalized for filtering/seeding |
| productType | Enum | Drives vendor form template |
| description, shortDescription | String | Auto-filled copy |
| aboutItems | [String] | Bullet points |
| specifications | [{label,value}] | Spec table |
| optionGroups | [{key,label,values}] | Selectable models (color/storage/size) |
| images | [{public_id,url}] | Reference images |
| suggestedPrice / suggestedDiscountPrice | Number | Company reference pricing (vendor overrides) |
| tags | [String] | Search |
| status | Enum | `active` \| `inactive` |
| createdBy | ObjectId → User | Admin author |

**Indexes:** brand, categorySlug, productType, status; text on name/brand/tags.

---

## 9c. Module: Payout (`payoutModel.js`)

**Collection:** `payouts`  
Vendor withdrawal request; balance derived from Paid orders minus payouts in `Requested|Paid`.

| Field | Type | Notes |
|---|---|---|
| vendor | ObjectId → User | Requester |
| store | ObjectId → Store | Earnings source |
| amount | Number | ≥ 1 |
| status | Enum | `Requested` \| `Paid` \| `Rejected` |
| method | Enum | `Bank` \| `UPI` |
| accountName/accountNumber/ifsc/upiId/note | String | Destination (light KYC) |
| processedBy / processedAt | Ref/Date | Admin action audit |
| reference / adminNote | String | Payment ref + admin remark |

---

## 9d. Module: Notification (`notificationModel.js`)

**Collection:** `notifications`  
In-app notifications for vendor / admin / customer.

| Field | Type | Notes |
|---|---|---|
| recipient | ObjectId → User | Owner (indexed) |
| role | Enum | `vendor` \| `superAdmin` \| `customer` |
| type | String | e.g. `order.created`, `payment.paid` |
| title, body, link | String | Copy + deep link |
| entityType / entityId | String/ObjectId | Related record |
| store | ObjectId → Store | Optional scope |
| readAt | Date | null = unread |

---

## 9e. Module: MediaAsset (`mediaAssetModel.js`)

**Collection:** `mediaassets`  
Vendor media library — reusable Cloudinary images attached to products by reference.

| Field | Type | Notes |
|---|---|---|
| vendor | ObjectId → User | Owner |
| store | ObjectId → Store | Optional |
| public_id, url | String | Cloudinary identity (unique per vendor) |
| originalName, bytes, width, height | Mixed | Metadata |
| tags | [String] | Search |

---

## 9f. Module: ChatSession (`chatSessionModel.js`)

**Collection:** `chatsessions`  
MultiAssist support thread (customer ↔ bot ↔ vendor).

| Field | Type | Notes |
|---|---|---|
| customerId | ObjectId → User | Thread owner |
| storeId / orderId | ObjectId | Linked store / order |
| subject, topic | String/Enum | e.g. `track_order`, `product_request` |
| status | Enum | `open` \| `waiting_vendor` \| `resolved` \| `closed` |
| productRequest | Object | Product info/stock/issue request |
| messages | [{role,senderId,text,meta}] | Embedded transcript |
| lastMessageAt | Date | Sort key |
| unreadByVendor / unreadByCustomer | Number | Badge counters |

---

## 10. Module map (code files)

| Module | Model file | Controller | Router mount |
|---|---|---|---|
| User / Auth | `userModel.js` | auth*, userController | `/auth`, `/user`, `/vendor/auth`, `/admin/auth` |
| Store | `storeModel.js` | storeController | `/store` |
| Product | `productModel.js` | productController | `/product` |
| Order | `orderModel.js` | orderController | `/order` |
| Coupon | `couponModel.js` | couponController | `/coupon` |
| Category | `categoryModel.js` | categoryController | `/category` |
| Address | `addressModel.js` | addressController | `/address` |
| Review | `reviewModel.js` | reviewController | `/review` |
| Banner | `bannerModel.js` | bannerController | `/banner` |
| CatalogProduct | `catalogProductModel.js` | catalogController | `/catalog` |
| Payout | `payoutModel.js` | payoutController | `/payout` |
| Notification | `notificationModel.js` | notificationController | `/notification` |
| MediaAsset | `mediaAssetModel.js` | mediaController | `/media` |
| ChatSession | `chatSessionModel.js` | chatController | `/chat` |
| Dashboard | (aggregates) | dashboardController | `/dashboard` |

---

## 11. Data rules (important)

1. **Never trust client prices** — recalculate on order create (coupon + shipping included).  
2. **Products must belong to the order’s store.**  
3. **Invoice only after Delivered.**  
4. **Vendor queries always filter by `vendor` / store ownership.**  
5. Soft concepts: product `status=inactive` hides from shop; user `isActive=false` blocks login.  
6. **Returns** mark order `Returned` with an offline-refund note — they do not auto-set payment to `Refunded`.  
7. **Stock restore is variant-aware:** cancel / return / delete (and vendor status → `Cancelled`/`Returned`) return units to the exact variant via `incrementProductStock`, keeping `product.stock` in sync with `variants[].stock`. Restore runs once per order (guarded against double-restore).  
8. **Order access:** every order endpoint enforces ownership — customer owns the order, vendor owns the store, or superAdmin.  

---

## 12. Related docs

- Vendor schema design workflow + ER / state workflows: [vendor/SCHEMA-DESIGN.md](./vendor/SCHEMA-DESIGN.md)  
- Vendor system design: [vendor/SYSTEM-DESIGN.md](./vendor/SYSTEM-DESIGN.md)  
