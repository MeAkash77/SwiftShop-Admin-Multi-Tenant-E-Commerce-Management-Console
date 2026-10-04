/**
 * Redux store — user (auth), cart, wishlist, notification slices.
 */
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice.js";
import cartReducer from "../features/cart/cartSlice.js";
import wishlistReducer from "../features/wishlist/wishlistSlice.js";
import notificationReducer from "../features/notification/notificationSlice.js";

const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    notification: notificationReducer,
  },
});

export default store;
