# Customer User Guide

Shop, cart, checkout, and account on MultiCommerce.

**Portal:** [Shop](https://multicommerce-web.vercel.app/customer) · [Login](https://multicommerce-web.vercel.app/login) · [Register](https://multicommerce-web.vercel.app/register)

---

## 1. Create an account

1. Open **Register**.  
2. Enter name, email, phone, password.  
3. Check email for **OTP** → open **Verify email** and submit the code.  
4. Go to **Login** and sign in.  

You cannot place orders until email is verified and you are logged in.

---

## 2. Browse products

1. Open **Shop / Products**.  
2. Search or filter by category / price if available.  
3. Open a product for images, variants (color, size, etc.), price, and reviews (many include customer photos).  
4. Optional: add to **Wishlist** (heart). Wishlist is **saved on this device only** (localStorage), not synced to your account.  

The catalog spans **10 categories** (Electronics, Mobiles, Fashion, Home, Appliances, Beauty, Sports, Books, Bags, Toys) with **100+** active products and photo reviews.

Guests can browse; **login is required** to buy.

When you return, the home page shows **welcome back**, **recently viewed** products, and a **deal countdown** so you can pick up shopping quickly.

---

## 3. Cart and address (before checkout)

1. Click **Add to cart** (choose variants if shown).  
2. Open **Cart**.  
3. Go to **Account → Addresses** and **add a shipping address** (set one as default).  
4. Checkout is blocked until at least one address exists.

---

## 4. Place an order

1. In **Cart**, review items and quantities.  
2. Select shipping address.  
3. Optional: enter a **coupon code** and Apply (server recalculates the discount).  
4. Choose payment:
   - **Online (Razorpay)** — UPI / cards / netbanking  
   - **Cash on Delivery (COD)**  
5. Confirm order.  
6. For online pay, complete the Razorpay window until success.  

Items from different stores may create **separate orders** (one per store). Delivery fees come from the store’s shipping settings (or free above a threshold).

---

## 5. Track orders and invoice

1. Open **Orders**.  
2. Find an order by ID or product name (search if available).  
3. Follow status: Pending → Confirmed → Processing → Shipped → **Delivered**.  
4. After **Delivered**, download **Tax invoice PDF** from the order actions.  
5. You can request **cancel** / **return** only when the system allows those actions for that status.

---

## 6. Account settings

| Page | What you can do |
|------|-----------------|
| Profile | Update name / contact |
| Addresses | Add, edit, set default, delete |
| Coupons | Active platform offers; apply store codes at checkout |
| Reviews | Your product ratings |
| Order updates | Status changes from recent orders |
| Wishlist | Saved on this device only |
| MultiAssist (Help) | Floating chat on shop pages — track/cancel/return help & product questions for sellers |
| Payments | Payment history (if listed) |
| Change password | Via account / security page |
| Logout | End session |

---

## 7. Customer dos and don’ts

**Do**
- Verify email before shopping  
- Keep a valid phone and full address  
- Check variant stock before paying  
- Save invoice after delivery  

**Don’t**
- Share your OTP or password  
- Close Razorpay mid-payment (wait for success/fail)  
- Expect invoice before the order is **Delivered**  

---

## Need help?

Footer pages: About, FAQ, Shipping, Returns, Privacy, Contact.  
Or ask the seller via order/support channels if your store lists contact details.
