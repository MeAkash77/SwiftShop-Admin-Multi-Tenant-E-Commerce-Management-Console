/**
 * API smoke: auth login, COD order with coupon/shipping, vendor product isolation.
 * Needs MongoDB (CI service or local).
 */
import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import mongoose from "mongoose";

process.env.VERCEL = "1";
process.env.JWT_TOKEN_SECRET =
  process.env.JWT_TOKEN_SECRET || "ci_jwt_access_secret_min_32_chars_xx";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "ci_jwt_refresh_secret_min_32_chars";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.MONGODB_URL =
  process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/multicommerce-smoke";

const hasMongo = Boolean(String(process.env.MONGODB_URL || "").trim());

describe("API smoke", { skip: !hasMongo }, () => {
  let app;
  let server;
  let baseUrl;
  let User;
  let Store;
  let Product;
  let Coupon;
  let Address;
  let Order;
  let OrderItem;

  const stamp = Date.now();
  const customerEmail = `smoke.customer.${stamp}@example.com`;
  const vendorAEmail = `smoke.vendora.${stamp}@example.com`;
  const vendorBEmail = `smoke.vendorb.${stamp}@example.com`;
  const password = "SmokeTest123!";
  const createdIds = {
    users: [],
    stores: [],
    products: [],
    coupons: [],
    addresses: [],
    orders: [],
  };

  async function json(method, path, { token, body } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  before(async () => {
    const { connectDB } = await import("../configs/database.js");
    await connectDB();
    app = (await import("../server.js")).default;
    User = (await import("../models/userModel.js")).default;
    Store = (await import("../models/storeModel.js")).default;
    Product = (await import("../models/productModel.js")).default;
    Coupon = (await import("../models/couponModel.js")).default;
    Address = (await import("../models/addressModel.js")).default;
    ({ Order, OrderItem } = await import("../models/orderModel.js"));

    server = createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    try {
      if (createdIds.orders.length) {
        await OrderItem.deleteMany({ orderId: { $in: createdIds.orders } });
        await Order.deleteMany({ _id: { $in: createdIds.orders } });
      }
      if (createdIds.coupons.length) {
        await Coupon.deleteMany({ _id: { $in: createdIds.coupons } });
      }
      if (createdIds.addresses.length) {
        await Address.deleteMany({ _id: { $in: createdIds.addresses } });
      }
      if (createdIds.products.length) {
        await Product.deleteMany({ _id: { $in: createdIds.products } });
      }
      if (createdIds.stores.length) {
        await Store.deleteMany({ _id: { $in: createdIds.stores } });
      }
      if (createdIds.users.length) {
        await User.deleteMany({ _id: { $in: createdIds.users } });
      }
    } catch {
      /* ignore cleanup errors */
    }
    await mongoose.disconnect().catch(() => {});
  });

  it("logs in a verified customer and places a COD order", async () => {
    const vendor = await User.create({
      email: vendorAEmail,
      password,
      firstName: "Smoke",
      lastName: "VendorA",
      role: "vendor",
      isEmailVerified: true,
      isActive: true,
    });
    createdIds.users.push(vendor._id);

    const customer = await User.create({
      email: customerEmail,
      password,
      firstName: "Smoke",
      lastName: "Customer",
      role: "customer",
      isEmailVerified: true,
      isActive: true,
    });
    createdIds.users.push(customer._id);

    const store = await Store.create({
      storeName: `Smoke Store ${stamp}`,
      description: "Smoke test store",
      vendorId: vendor._id,
      email: `store.${stamp}@example.com`,
      phone: "9000000001",
      address: "Smoke address",
      shippingFee: 40,
      freeShippingAbove: 5000,
      isActive: true,
    });
    createdIds.stores.push(store._id);

    const product = await Product.create({
      vendor: vendor._id,
      store: store._id,
      name: "Smoke Widget",
      slug: `smoke-widget-${stamp}`,
      sku: `SMOKE-${stamp}`,
      description: "Smoke product",
      price: 200,
      stock: 10,
      status: "active",
      productType: "generic",
    });
    createdIds.products.push(product._id);

    const couponCode = `SMK${String(stamp).slice(-6)}`;
    const coupon = await Coupon.create({
      code: couponCode,
      type: "fixed",
      value: 20,
      minOrder: 0,
      store: store._id,
      createdBy: vendor._id,
      isActive: true,
    });
    createdIds.coupons.push(coupon._id);

    const address = await Address.create({
      customer: customer._id,
      fullName: "Smoke Customer",
      phone: "9000000002",
      pincode: "380001",
      locality: "Test",
      addressLine: "1 Smoke Rd",
      city: "Ahmedabad",
      state: "Gujarat",
      addressType: "Home",
      isDefault: true,
    });
    createdIds.addresses.push(address._id);

    const login = await json("POST", "/api/auth/login", {
      body: { email: customerEmail, password },
    });
    assert.equal(login.status, 200, JSON.stringify(login.data));
    assert.ok(login.data.accessToken);

    const order = await json("POST", "/api/order/create", {
      token: login.data.accessToken,
      body: {
        storeId: String(store._id),
        addressId: String(address._id),
        paymentMethod: "COD",
        couponCode,
        items: [{ productId: String(product._id), quantity: 1 }],
      },
    });

    assert.equal(order.status, 201, JSON.stringify(order.data));
    assert.equal(order.data.data.paymentMethod, "COD");
    assert.equal(order.data.data.shippingFee, 40);
    assert.equal(order.data.data.discountAmount, 20);
    assert.equal(order.data.data.totalAmount, 220);
    assert.equal(order.data.data.couponCode, couponCode);
    createdIds.orders.push(order.data.data._id);
  });

  it("blocks vendor B from updating vendor A product", async () => {
    const vendorA = await User.create({
      email: `smoke.vendora2.${stamp}@example.com`,
      password,
      firstName: "Smoke",
      lastName: "VendorA2",
      role: "vendor",
      isEmailVerified: true,
      isActive: true,
    });
    createdIds.users.push(vendorA._id);

    const vendorB = await User.create({
      email: vendorBEmail,
      password,
      firstName: "Smoke",
      lastName: "VendorB",
      role: "vendor",
      isEmailVerified: true,
      isActive: true,
    });
    createdIds.users.push(vendorB._id);

    const storeA = await Store.create({
      storeName: `Smoke Store Iso ${stamp}`,
      description: "Isolation store",
      vendorId: vendorA._id,
      email: `storeiso.${stamp}@example.com`,
      phone: "9000000011",
      address: "A",
      isActive: true,
    });
    createdIds.stores.push(storeA._id);

    const product = await Product.create({
      vendor: vendorA._id,
      store: storeA._id,
      name: "Owned by A",
      slug: `owned-a-${stamp}`,
      sku: `OWNEDA-${stamp}`,
      description: "iso",
      price: 100,
      stock: 5,
      status: "active",
      productType: "generic",
    });
    createdIds.products.push(product._id);

    const loginB = await json("POST", "/api/vendor/auth/login", {
      body: { email: vendorBEmail, password },
    });
    assert.equal(loginB.status, 200, JSON.stringify(loginB.data));
    assert.ok(loginB.data.accessToken);

    const update = await json("PUT", `/api/product/${product._id}`, {
      token: loginB.data.accessToken,
      body: { name: "Hijacked" },
    });
    assert.equal(update.status, 403, JSON.stringify(update.data));
  });
});
