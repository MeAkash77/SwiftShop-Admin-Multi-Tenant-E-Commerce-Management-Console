import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, removeFromCart, updateQuantity } from "../../features/cart/cartSlice";
import { addressApi, couponApi, orderApi, storeApi } from "../../api/services";
import { completeRazorpayPayment } from "../../utils/completeRazorpayPayment";
import { notify } from "../../utils/notify";

const PAYMENT_OPTIONS = [
  {
    id: "UPI",
    label: "UPI",
    hint: "GPay, PhonePe, Paytm & more",
    icon: "fa-solid fa-qrcode",
  },
  {
    id: "Card",
    label: "Card",
    hint: "Credit & debit cards",
    icon: "fa-solid fa-credit-card",
  },
  {
    id: "NetBanking",
    label: "Net Banking",
    hint: "All major banks",
    icon: "fa-solid fa-building-columns",
  },
  {
    id: "Wallet",
    label: "Wallet",
    hint: "Razorpay wallets",
    icon: "fa-solid fa-wallet",
  },
  {
    id: "COD",
    label: "Cash on Delivery",
    hint: "Pay when order arrives",
    icon: "fa-solid fa-hand-holding-dollar",
  },
];

const emptyAddressForm = {
  fullName: "",
  phone: "",
  pincode: "",
  locality: "",
  addressLine: "",
  city: "",
  state: "",
  addressType: "Home",
  isDefault: true,
};

const CustomerCart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const items = useSelector((state) => state.cart.items);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [storeShipping, setStoreShipping] = useState(null);

  async function loadAddresses() {
    if (!user?.id) return;
    setLoadingAddresses(true);
    try {
      const res = await addressApi.list();
      const list = res.data?.data || [];
      setAddresses(list);
      const preferred =
        list.find((a) => a.isDefault)?._id || list[0]?._id || "";
      setSelectedAddressId((prev) =>
        prev && list.some((a) => a._id === prev) ? prev : preferred
      );
      setShowAddressForm(list.length === 0);
    } catch (err) {
      notify.fromError(err, "Could not load delivery addresses.");
    } finally {
      setLoadingAddresses(false);
    }
  }

  useEffect(() => {
    loadAddresses().catch(console.error);
  }, [user?.id]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const storeIds = useMemo(
    () => [...new Set(items.map((item) => String(item.storeId)).filter(Boolean))],
    [items]
  );

  const storeKey = storeIds.join(",");

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponInput("");
  }, [storeKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (storeIds.length !== 1) {
        setStoreShipping(null);
        return;
      }
      try {
        const res = await storeApi.getById(storeIds[0]);
        if (!cancelled) setStoreShipping(res.data?.data || res.data || null);
      } catch {
        if (!cancelled) setStoreShipping(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeKey]);

  const shippingFeePreview = useMemo(() => {
    if (!storeShipping) return 0;
    const fee = Number(storeShipping.shippingFee) || 0;
    const threshold = storeShipping.freeShippingAbove;
    if (threshold != null && subtotal >= Number(threshold)) return 0;
    return fee;
  }, [storeShipping, subtotal]);

  const discountPreview = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal - discountPreview + shippingFeePreview);

  const multiStore = storeIds.length > 1;
  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
  const canCheckout = Boolean(selectedAddressId) && !multiStore && !placing;

  function setQty(item, nextQty) {
    const max = Math.max(1, Number(item.stock) || 99);
    const quantity = Math.min(max, Math.max(1, nextQty));
    dispatch(
      updateQuantity({
        productId: item.productId,
        variantLabel: item.variantLabel || "",
        quantity,
      })
    );
    if (nextQty > max) {
      notify.warning(`Only ${max} left in stock for this option.`);
    }
  }

  function removeItem(item) {
    dispatch(
      removeFromCart({
        productId: item.productId,
        variantLabel: item.variantLabel || "",
      })
    );
    notify.info("Item removed from cart.");
  }

  async function saveNewAddress(event) {
    event.preventDefault();
    setSavingAddress(true);
    try {
      const res = await addressApi.create(addressForm);
      const created = res.data?.data;
      notify.success("Address added.");
      setAddressForm(emptyAddressForm);
      setShowAddressForm(false);
      await loadAddresses();
      if (created?._id) setSelectedAddressId(created._id);
    } catch (err) {
      notify.fromError(err, "Could not save address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function applyCoupon() {
    if (!storeIds[0]) {
      notify.warning("Add items from one store before applying a coupon.");
      return;
    }
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      notify.warning("Enter a coupon code.");
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await couponApi.validate({
        code,
        storeId: storeIds[0],
        subtotal,
      });
      setAppliedCoupon(res.data?.data || null);
      notify.success("Coupon applied.");
    } catch (err) {
      setAppliedCoupon(null);
      notify.fromError(err, "Coupon not valid.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function clearCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
  }

  async function checkout() {
    if (!items.length) {
      notify.warning("Your cart is empty.");
      return;
    }

    if (multiStore) {
      notify.warning("Checkout one store at a time. Remove items from other stores first.");
      return;
    }

    if (!selectedAddressId) {
      notify.warning("Add and select a delivery address before placing your order.");
      setShowAddressForm(true);
      return;
    }

    setPlacing(true);
    try {
      const response = await orderApi.create({
        storeId: storeIds[0],
        addressId: selectedAddressId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          options: item.options || undefined,
        })),
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      });

      const order = response.data?.data;
      const razorpay = response.data?.razorpay;
      const charged =
        razorpay?.amount != null
          ? Number(razorpay.amount) / 100
          : Number(order?.totalAmount) || total;

      if (paymentMethod === "COD") {
        dispatch(clearCart());
        notify.success("Order placed. Pay on delivery.");
        navigate("/customer/orders");
        return;
      }

      await completeRazorpayPayment({
        order,
        razorpay,
        user,
        description: `Pay ₹${charged} for ${order.orderNumber}`,
      });

      dispatch(clearCart());
      notify.success("Payment successful.");
      navigate("/customer/orders");
    } catch (err) {
      notify.fromError(err, "Checkout failed.");
    } finally {
      setPlacing(false);
    }
  }

  if (!items.length) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon" aria-hidden="true">
          <i className="fa-solid fa-cart-shopping" />
        </div>
        <h1>Your cart is empty</h1>
        <p>Looks like you haven’t added anything yet. Explore deals and fill it up.</p>
        <div className="cart-empty-actions">
          <Link className="shop-btn shop-btn-primary" to="/customer/products">
            Browse products
          </Link>
          <Link className="shop-btn shop-btn-outline" to="/customer">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const placeLabel =
    paymentMethod === "COD" ? "Place order" : `Pay ₹${total.toLocaleString("en-IN")}`;

  return (
    <div className="cart-page">
      <header className="cart-header">
        <div>
          <h1>Shopping cart</h1>
          <p>
            {itemCount} item{itemCount === 1 ? "" : "s"} · ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <Link className="cart-continue" to="/customer/products">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Continue shopping
        </Link>
      </header>

      {multiStore ? (
        <div className="cart-banner cart-banner--warn" role="status">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          <div>
            <strong>Items from multiple stores</strong>
            <p>
              Checkout supports one store per order. Remove items from other stores, then place
              your order.
            </p>
          </div>
        </div>
      ) : null}

      {!loadingAddresses && !addresses.length ? (
        <div className="cart-banner cart-banner--warn" role="status">
          <i className="fa-solid fa-location-dot" aria-hidden="true" />
          <div>
            <strong>Delivery address required</strong>
            <p>Add a delivery address below before you can place an order or pay.</p>
          </div>
        </div>
      ) : null}

      <div className="cart-layout">
        <div className="cart-main">
          <section className="cart-panel">
            <div className="cart-panel-head">
              <h2>Delivery address</h2>
              <button
                type="button"
                className="cart-text-btn"
                onClick={() => setShowAddressForm((v) => !v)}
              >
                {showAddressForm ? "Hide form" : "+ Add new"}
              </button>
            </div>

            {loadingAddresses ? (
              <p className="cart-panel-hint">Loading addresses…</p>
            ) : null}

            {!loadingAddresses && addresses.length ? (
              <div className="cart-address-list" role="radiogroup" aria-label="Delivery address">
                {addresses.map((addr) => {
                  const selected = selectedAddressId === addr._id;
                  return (
                    <button
                      key={addr._id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`cart-address-card ${selected ? "is-selected" : ""}`}
                      onClick={() => setSelectedAddressId(addr._id)}
                    >
                      <span className="cart-address-type">
                        {addr.addressType}
                        {addr.isDefault ? " · Default" : ""}
                      </span>
                      <strong>
                        {addr.fullName} · {addr.phone}
                      </strong>
                      <p>
                        {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} -{" "}
                        {addr.pincode}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {showAddressForm ? (
              <form className="cart-address-form" onSubmit={saveNewAddress}>
                <div className="cart-address-form-row">
                  <input
                    required
                    placeholder="Full name"
                    value={addressForm.fullName}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                  />
                  <input
                    required
                    placeholder="10-digit mobile"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="cart-address-form-row">
                  <input
                    required
                    placeholder="Pincode"
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, pincode: e.target.value }))
                    }
                  />
                  <input
                    required
                    placeholder="Locality"
                    value={addressForm.locality}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, locality: e.target.value }))
                    }
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Address (area and street)"
                  value={addressForm.addressLine}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, addressLine: e.target.value }))
                  }
                />
                <div className="cart-address-form-row">
                  <input
                    required
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                  <input
                    required
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, state: e.target.value }))
                    }
                  />
                </div>
                <div className="cart-address-types">
                  {["Home", "Work", "Other"].map((type) => (
                    <label key={type}>
                      <input
                        type="radio"
                        name="cartAddressType"
                        checked={addressForm.addressType === type}
                        onChange={() =>
                          setAddressForm((p) => ({ ...p, addressType: type }))
                        }
                      />
                      {type}
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  className="shop-btn shop-btn-primary"
                  disabled={savingAddress}
                >
                  {savingAddress ? "Saving…" : "Save address"}
                </button>
              </form>
            ) : null}

            <p className="cart-panel-hint" style={{ marginTop: 12 }}>
              Or manage all addresses in{" "}
              <Link to="/customer/account/addresses">Account → Addresses</Link>.
            </p>
          </section>

          <section className="cart-panel">
            <div className="cart-panel-head">
              <h2>Items ({items.length})</h2>
              <button
                type="button"
                className="cart-text-btn"
                onClick={() => {
                  if (window.confirm("Clear all items from your cart?")) {
                    dispatch(clearCart());
                    notify.info("Cart cleared.");
                  }
                }}
              >
                Clear cart
              </button>
            </div>

            <ul className="cart-items">
              {items.map((item) => {
                const lineTotal = item.price * item.quantity;
                const maxStock = Math.max(1, Number(item.stock) || 99);
                const atMax = item.quantity >= maxStock;

                return (
                  <li
                    className="cart-item"
                    key={`${item.productId}-${item.variantLabel || "default"}`}
                  >
                    <Link
                      className="cart-item-media"
                      to={`/customer/products/${item.productId}`}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>No image</span>
                      )}
                    </Link>

                    <div className="cart-item-body">
                      <div className="cart-item-top">
                        <div>
                          <Link
                            className="cart-item-title"
                            to={`/customer/products/${item.productId}`}
                          >
                            {item.name}
                          </Link>
                          {item.variantLabel ? (
                            <p className="cart-item-variant">{item.variantLabel}</p>
                          ) : null}
                          <p className="cart-item-stock">
                            {item.stock != null
                              ? item.stock > 0
                                ? `${item.stock} available`
                                : "Out of stock"
                              : "In stock"}
                          </p>
                        </div>
                        <div className="cart-item-price">
                          <strong>₹{lineTotal.toLocaleString("en-IN")}</strong>
                          <span>₹{item.price.toLocaleString("en-IN")} each</span>
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        <div className="cart-qty" aria-label="Quantity">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                            onClick={() => setQty(item, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={atMax}
                            onClick={() => setQty(item, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-text-btn cart-text-btn--danger"
                          onClick={() => removeItem(item)}
                        >
                          <i className="fa-regular fa-trash-can" aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="cart-panel">
            <div className="cart-panel-head">
              <h2>Payment method</h2>
            </div>
            <p className="cart-panel-hint">
              Choose how you want to pay after confirming your delivery address.
            </p>
            <div className="cart-pay-grid" role="radiogroup" aria-label="Payment method">
              {PAYMENT_OPTIONS.map((option) => {
                const selected = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`cart-pay-card ${selected ? "is-selected" : ""}`}
                    onClick={() => setPaymentMethod(option.id)}
                    disabled={!selectedAddressId}
                  >
                    <i className={option.icon} aria-hidden="true" />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.hint}</small>
                    </span>
                    <em className="cart-pay-check" aria-hidden="true">
                      <i className="fa-solid fa-check" />
                    </em>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="cart-summary">
          <h2>Price details</h2>
          {selectedAddress ? (
            <div className="cart-summary-ship">
              <span>Deliver to</span>
              <strong>
                {selectedAddress.fullName}, {selectedAddress.city} {selectedAddress.pincode}
              </strong>
            </div>
          ) : (
            <div className="cart-summary-ship cart-summary-ship--warn">
              <span>Deliver to</span>
              <strong>Add an address to continue</strong>
            </div>
          )}
          <div className="cart-summary-row">
            <span>
              Price ({itemCount} item{itemCount === 1 ? "" : "s"})
            </span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="cart-summary-row cart-summary-coupon">
            <span>Coupon</span>
            <div className="cart-coupon-row">
              <input
                type="text"
                className="cart-coupon-input"
                placeholder="Enter code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon || multiStore}
                aria-label="Coupon code"
              />
              {appliedCoupon ? (
                <button type="button" className="shop-btn shop-btn-outline" onClick={clearCoupon}>
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="shop-btn shop-btn-outline cart-coupon-apply"
                  onClick={applyCoupon}
                  disabled={applyingCoupon || multiStore || !couponInput.trim()}
                >
                  {applyingCoupon ? "…" : "Apply"}
                </button>
              )}
            </div>
            {appliedCoupon ? (
              <small className="cart-summary-free">
                {appliedCoupon.code} −₹{Number(appliedCoupon.discount).toLocaleString("en-IN")}
              </small>
            ) : null}
          </div>
          {discountPreview > 0 ? (
            <div className="cart-summary-row">
              <span>Discount</span>
              <span className="cart-summary-free">
                −₹{discountPreview.toLocaleString("en-IN")}
              </span>
            </div>
          ) : null}
          <div className="cart-summary-row">
            <span>Delivery</span>
            <span className={shippingFeePreview === 0 ? "cart-summary-free" : undefined}>
              {shippingFeePreview === 0
                ? "FREE"
                : `₹${shippingFeePreview.toLocaleString("en-IN")}`}
            </span>
          </div>
          <div className="cart-summary-row">
            <span>Payment</span>
            <span>{paymentMethod === "COD" ? "Cash on delivery" : paymentMethod}</span>
          </div>
          <div className="cart-summary-total">
            <span>Total payable</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>

          <button
            type="button"
            className="shop-btn shop-btn-primary cart-checkout-btn"
            onClick={checkout}
            disabled={!canCheckout}
          >
            {placing ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Processing…
              </>
            ) : !selectedAddressId ? (
              "Add address to continue"
            ) : (
              placeLabel
            )}
          </button>

          <ul className="cart-perks">
            <li>
              <i className="fa-solid fa-location-dot" aria-hidden="true" /> Address required before
              payment
            </li>
            <li>
              <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Secure payment
            </li>
            <li>
              <i className="fa-solid fa-truck" aria-hidden="true" />{" "}
              {shippingFeePreview === 0
                ? "Free delivery on this order"
                : `Delivery ₹${shippingFeePreview.toLocaleString("en-IN")} (from store settings)`}
            </li>
          </ul>
        </aside>
      </div>

      <div className="cart-mobile-bar">
        <div>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
          <span>{selectedAddressId ? `${itemCount} items` : "Address needed"}</span>
        </div>
        <button
          type="button"
          className="shop-btn shop-btn-primary"
          onClick={checkout}
          disabled={!canCheckout}
        >
          {placing ? "…" : !selectedAddressId ? "Add address" : placeLabel}
        </button>
      </div>
    </div>
  );
};

export default CustomerCart;
