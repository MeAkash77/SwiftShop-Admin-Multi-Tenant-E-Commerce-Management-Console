import { createSlice } from "@reduxjs/toolkit";

const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
})();

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: storedUser,
    isAuthenticated: Boolean(localStorage.getItem("token")),
    isLoading: false,
    error: null,
    token: localStorage.getItem("token"),
    refreshToken: null,
    expiresAt: null,
    expiresIn: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("user");
      }
    },
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem("token", action.payload);
      } else {
        localStorage.removeItem("token");
      }
    },
    setRefreshToken: (state, action) => {
      state.refreshToken = action.payload;
    },
    setExpiresAt: (state, action) => {
      state.expiresAt = action.payload;
    },
    setExpiresIn: (state, action) => {
      state.expiresIn = action.payload;
    },
    loginSuccess: (state, action) => {
      const { accessToken, user } = action.payload;
      state.token = accessToken;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const {
  setUser,
  setIsAuthenticated,
  setIsLoading,
  setError,
  setToken,
  setRefreshToken,
  setExpiresAt,
  setExpiresIn,
  loginSuccess,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
