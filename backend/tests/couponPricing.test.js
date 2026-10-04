/**
 * Pure pricing helpers — no DB required (always run in CI).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeCouponDiscount,
  computeShippingFee,
} from "../utils/couponPricing.js";

describe("couponPricing", () => {
  it("computes percent and fixed discounts", () => {
    assert.equal(
      computeCouponDiscount({ type: "percent", value: 10, minOrder: 0 }, 1000),
      100
    );
    assert.equal(
      computeCouponDiscount({ type: "fixed", value: 150, minOrder: 0 }, 1000),
      150
    );
  });

  it("never discounts more than subtotal", () => {
    assert.equal(
      computeCouponDiscount({ type: "fixed", value: 500, minOrder: 0 }, 200),
      200
    );
  });

  it("enforces minOrder", () => {
    assert.throws(
      () =>
        computeCouponDiscount({ type: "percent", value: 10, minOrder: 500 }, 100),
      /at least/
    );
  });

  it("applies free shipping threshold", () => {
    assert.equal(
      computeShippingFee({ shippingFee: 49, freeShippingAbove: 999 }, 500),
      49
    );
    assert.equal(
      computeShippingFee({ shippingFee: 49, freeShippingAbove: 999 }, 999),
      0
    );
  });
});
