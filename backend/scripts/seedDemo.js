/**
 * Seed a demo marketplace dataset for local demos / QA.
 *
 * Usage (from backend/):
 *   node scripts/seedDemo.js
 *
 * Requires MONGODB_URL (and optional JWT secrets unused here).
 * Idempotent on demo emails — upserts the same accounts each run.
 */
import mongoose from "mongoose";
import envConfig from "../configs/envConfig.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import Product from "../models/productModel.js";
import Address from "../models/addressModel.js";
import Coupon from "../models/couponModel.js";
import { Order, OrderItem } from "../models/orderModel.js";
import { connectDB } from "../configs/database.js";
import { assertSeedAllowed } from "../utils/assertSeedAllowed.js";

assertSeedAllowed("seed:demo");

const DEMO = {
  admin: {
    email: "demo.admin@multicommerce.test",
    password: "DemoAdmin123!",
    firstName: "Demo",
    lastName: "Admin",
    role: "superAdmin",
  },
  vendor: {
    email: "demo.vendor@multicommerce.test",
    password: "DemoVendor123!",
    firstName: "Demo",
    lastName: "Vendor",
    role: "vendor",
  },
  customer: {
    email: "demo.customer@multicommerce.test",
    password: "DemoCustomer123!",
    firstName: "Demo",
    lastName: "Customer",
    role: "customer",
  },
};

async function upsertUser(profile) {
  let user = await User.findOne({ email: profile.email }).select("+password");
  if (user) {
    user.firstName = profile.firstName;
    user.lastName = profile.lastName;
    user.role = profile.role;
    user.password = profile.password;
    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();
    return user;
  }
  return User.create({
    ...profile,
    isEmailVerified: true,
    isActive: true,
  });
}

async function main() {
  if (!envConfig.MONGODB_URL) {
    throw new Error("MONGODB_URL is not set");
  }

  await connectDB();

  const admin = await upsertUser(DEMO.admin);
  const vendor = await upsertUser(DEMO.vendor);
  const customer = await upsertUser(DEMO.customer);

  let store = await Store.findOne({ vendorId: vendor._id });
  if (!store) {
    store = await Store.create({
      storeName: "Demo Market Store",
      description: "Seeded demo storefront for MultiCommerce walkthroughs.",
      vendorId: vendor._id,
      email: "demo.store@multicommerce.test",
      phone: "9876543210",
      address: "12 Demo Street, Ahmedabad, GJ 380001",
      shippingFee: 49,
      freeShippingAbove: 999,
      estimatedDeliveryDays: 4,
      isActive: true,
    });
  } else {
    store.shippingFee = 49;
    store.freeShippingAbove = 999;
    store.isActive = true;
    await store.save();
  }

  let product = await Product.findOne({
    store: store._id,
    sku: "DEMO-SKU-001",
  });
  if (!product) {
    product = await Product.create({
      vendor: vendor._id,
      store: store._id,
      name: "Demo Cotton Tee",
      slug: `demo-cotton-tee-${Date.now()}`,
      sku: "DEMO-SKU-001",
      description: "<p>Comfortable cotton tee for demos and checkout tests.</p>",
      shortDescription: "Demo product",
      price: 799,
      discountPrice: 599,
      stock: 50,
      brand: "MultiDemo",
      status: "active",
      productType: "generic",
    });
  } else {
    product.stock = 50;
    product.status = "active";
    product.price = 799;
    product.discountPrice = 599;
    await product.save();
  }

  let address = await Address.findOne({ customer: customer._id });
  if (!address) {
    address = await Address.create({
      customer: customer._id,
      fullName: "Demo Customer",
      phone: "9123456780",
      pincode: "380001",
      locality: "Navrangpura",
      addressLine: "42 Demo Lane",
      city: "Ahmedabad",
      state: "Gujarat",
      addressType: "Home",
      isDefault: true,
    });
  }

  let coupon = await Coupon.findOne({ code: "DEMO10", store: store._id });
  if (!coupon) {
    coupon = await Coupon.create({
      code: "DEMO10",
      type: "percent",
      value: 10,
      minOrder: 100,
      maxUses: 1000,
      store: store._id,
      createdBy: vendor._id,
      isActive: true,
    });
  }

  const existingOrder = await Order.findOne({
    customerId: customer._id,
    storeId: store._id,
    orderNumber: /^DEMO-/,
  });

  if (!existingOrder) {
    const unit = product.discountPrice || product.price;
    const subtotal = unit;
    const shippingFee = 49;
    const order = await Order.create({
      orderNumber: `DEMO-${Date.now()}`,
      customerId: customer._id,
      storeId: store._id,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        pincode: address.pincode,
        locality: address.locality,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        addressType: address.addressType,
      },
      subtotal,
      tax: 0,
      shippingFee,
      discountAmount: 0,
      totalAmount: subtotal + shippingFee,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      paymentNote: "Seeded demo COD order",
      orderStatus: "Confirmed",
    });
    await OrderItem.create({
      orderId: order._id,
      productId: product._id,
      quantity: 1,
      price: unit,
    });
  }

  console.log("Demo seed complete.\n");
  console.log("Logins (email / password):");
  console.log(`  Admin:    ${DEMO.admin.email} / ${DEMO.admin.password}`);
  console.log(`  Vendor:   ${DEMO.vendor.email} / ${DEMO.vendor.password}`);
  console.log(`  Customer: ${DEMO.customer.email} / ${DEMO.customer.password}`);
  console.log(`\nStore: ${store.storeName} (${store._id})`);
  console.log(`Product: ${product.name} (${product._id}) ₹${product.discountPrice}`);
  console.log(`Coupon: ${coupon.code} (10% off)`);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
