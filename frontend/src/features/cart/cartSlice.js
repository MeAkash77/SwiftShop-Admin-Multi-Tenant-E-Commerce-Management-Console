import { createSlice } from "@reduxjs/toolkit";

const storedCart = (() => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
})();

const persist = (items) => {
  localStorage.setItem("cart", JSON.stringify(items));
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: storedCart,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const variantKey = product.variantLabel || "";
      const existing = state.items.find(
        (item) =>
          item.productId === product.productId &&
          (item.variantLabel || "") === variantKey
      );

      if (existing) {
        existing.quantity += product.quantity || 1;
        existing.stock = product.stock ?? existing.stock;
        existing.price = product.price ?? existing.price;
      } else {
        state.items.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          storeId: product.storeId,
          stock: product.stock,
          image: product.image || null,
          quantity: product.quantity || 1,
          options: product.options || null,
          variantLabel: variantKey || null,
        });
      }

      persist(state.items);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity, variantLabel = "" } = action.payload;
      const item = state.items.find(
        (entry) =>
          entry.productId === productId &&
          (entry.variantLabel || "") === (variantLabel || "")
      );
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
      persist(state.items);
    },
    removeFromCart: (state, action) => {
      const payload = action.payload;
      if (typeof payload === "string") {
        state.items = state.items.filter((item) => item.productId !== payload);
      } else {
        const { productId, variantLabel = "" } = payload || {};
        state.items = state.items.filter(
          (item) =>
            !(
              item.productId === productId &&
              (item.variantLabel || "") === variantLabel
            )
        );
      }
      persist(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
