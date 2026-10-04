/**
 * Shared Axios client for MultiCommerce API.
 * Attaches Bearer token; on 401 refreshes via cookie and retries the request.
 *
 * In multi-portal mode, refresh uses a portal-scoped cookie so customer /
 * vendor / admin sessions do not overwrite each other.
 */
import axios from "axios";
import store from "../app/store";
import { loginSuccess, logout, setToken } from "../features/user/userSlice";
import { resolvePortal } from "../utils/portal";

/** Dev: same-origin `/api` via Vite proxy. Prod: VITE_API_URL. */
const baseURL =
  import.meta.env.DEV
    ? "/api"
    : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function activePortal() {
  return resolvePortal() || "customer";
}

const apiInstance = axios.create({
  baseURL,
  withCredentials: true,
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-App-Portal"] = activePortal();
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  failedQueue = [];
}

function shouldSkipRefresh(config = {}) {
  const url = String(config.url || "");
  return (
    url.includes("/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/admin/auth/login") ||
    url.includes("/vendor/auth/login") ||
    url.includes("/auth/register")
  );
}

async function requestNewAccessToken() {
  const portal = activePortal();
  // Use plain axios so we don't recurse through interceptors
  const { data } = await axios.post(
    `${baseURL}/auth/refresh`,
    { portal },
    {
      withCredentials: true,
      headers: { "X-App-Portal": portal },
    }
  );
  const accessToken = data.accessToken;
  if (!accessToken) {
    throw new Error("No access token returned");
  }

  localStorage.setItem("token", accessToken);
  store.dispatch(setToken(accessToken));

  if (data.user) {
    const current = store.getState().user.user;
    store.dispatch(
      loginSuccess({
        accessToken,
        user: {
          id: data.user.id || current?.id,
          email: data.user.email || current?.email,
          role: data.user.role || current?.role,
          firstName: data.user.firstName || current?.firstName,
          lastName: data.user.lastName || current?.lastName,
        },
      })
    );
  }

  return accessToken;
}

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status !== 401 || originalRequest._retry || shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await requestNewAccessToken();
      processQueue(null, newToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Call on app start to quietly restore a session from the httpOnly refresh cookie.
 */
export async function bootstrapSession() {
  const hasUser = Boolean(localStorage.getItem("user"));
  const hasToken = Boolean(localStorage.getItem("token"));
  if (!hasUser && !hasToken) return false;

  try {
    await requestNewAccessToken();
    return true;
  } catch {
    // Refresh cookie missing/expired — clear stale local session
    if (hasToken || hasUser) {
      store.dispatch(logout());
    }
    return false;
  }
}

export default apiInstance;
