import { createSlice } from "@reduxjs/toolkit";

const stored = (() => {
  try {
    return JSON.parse(localStorage.getItem("wishlist") || "[]");
  } catch {
    return [];
  }
})();

const persist = (items) => {
  localStorage.setItem("wishlist", JSON.stringify(items));
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: stored },
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const exists = state.items.find((item) => item.productId === product.productId);
      if (exists) {
        state.items = state.items.filter((item) => item.productId !== product.productId);
      } else {
        state.items.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          image: product.image || null,
          storeId: product.storeId || null,
        });
      }
      persist(state.items);
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      persist(state.items);
    },
  },
});

export const { toggleWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
