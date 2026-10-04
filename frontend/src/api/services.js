/**
 * API helpers used by pages (store, product, order, address, …).
 * Thin wrappers over apiInstance — prefer these over raw URLs in UI code.
 */
import apiInstance from "./apiInstaince";

/** Normalize list payloads: array or { data, page, total, … }. */
export function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      page: 1,
      limit: payload.length,
      total: payload.length,
      totalPages: 1,
    };
  }
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data,
    page: Number(payload?.page) || 1,
    limit: Number(payload?.limit) || data.length || 24,
    total: Number(payload?.total ?? data.length) || 0,
    totalPages: Number(payload?.totalPages) || (data.length ? 1 : 0),
  };
}

export const storeApi = {
  list: () => apiInstance.get("/store"),
  getById: (id) => apiInstance.get(`/store/${id}`),
  getByVendor: (vendorId) => apiInstance.get(`/store/vendor/${vendorId}`),
  create: (payload) => apiInstance.post("/store", payload),
  update: (id, payload) => apiInstance.put(`/store/${id}`, payload),
  remove: (id) => apiInstance.delete(`/store/${id}`),
};

export const productApi = {
  list: (params) => apiInstance.get("/product", { params }),
  search: (keyword, params = {}) =>
    apiInstance.get("/product/search", {
      params:
        typeof keyword === "string"
          ? { keyword, ...params }
          : { ...keyword },
    }),
  filter: (params) => apiInstance.get("/product/filter", { params }),
  getById: (id) => apiInstance.get(`/product/${id}`),
  vendorList: () => apiInstance.get("/product/vendor"),
  create: (formData) =>
    apiInstance.post("/product/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, payload) => {
    const isForm =
      typeof FormData !== "undefined" && payload instanceof FormData;
    return apiInstance.put(`/product/${id}`, payload, {
      headers: isForm ? { "Content-Type": "multipart/form-data" } : undefined,
    });
  },
  remove: (id) => apiInstance.delete(`/product/${id}`),
  downloadBulkTemplate: (format = "xlsx") =>
    apiInstance.get("/product/bulk/template", {
      params: { format },
      responseType: "blob",
    }),
  bulkImport: (formData) =>
    apiInstance.post("/product/bulk/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  bulkMark: (payload) => apiInstance.post("/product/bulk/mark", payload),
  bulkDelete: (payload) => apiInstance.post("/product/bulk/delete", payload),
};

export const reviewApi = {
  byProduct: (productId) => apiInstance.get(`/review/product/${productId}`),
  mine: () => apiInstance.get("/review/me"),
  manage: (params) => apiInstance.get("/review/manage", { params }),
  create: (formData) =>
    apiInstance.post("/review", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    apiInstance.put(`/review/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => apiInstance.delete(`/review/${id}`),
};

export const bannerApi = {
  list: (params) => apiInstance.get("/banner", { params }),
  manage: (params) => apiInstance.get("/banner/manage", { params }),
  create: (formData) =>
    apiInstance.post("/banner", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    apiInstance.put(`/banner/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => apiInstance.delete(`/banner/${id}`),
};

export const orderApi = {
  create: (payload) => apiInstance.post("/order/create", payload),
  byCustomer: (customerId) => apiInstance.get(`/order/customer/${customerId}`),
  byStore: (storeId) => apiInstance.get(`/order/store/${storeId}`),
  getById: (id) => apiInstance.get(`/order/${id}`),
  updateStatus: (id, status) => apiInstance.put(`/order/status/${id}`, { status }),
  pay: (id, paymentMethod) => apiInstance.post(`/order/pay/${id}`, { paymentMethod }),
  verifyPayment: (payload) => apiInstance.post("/order/verify-payment", payload),
  razorpayConfig: () => apiInstance.get("/order/razorpay/config"),
  updatePayment: (id, payload) => apiInstance.put(`/order/payment/${id}`, payload),
  cancel: (id) => apiInstance.put(`/order/cancel/${id}`),
  returnOrder: (id) => apiInstance.put(`/order/return/${id}`),
  listAll: () => apiInstance.get("/order"),
  remove: (id) => apiInstance.delete(`/order/${id}`),
  downloadInvoice: (id) =>
    apiInstance.get(`/order/${id}/invoice`, {
      responseType: "blob",
    }),
};

export const couponApi = {
  active: (params) => apiInstance.get("/coupon/active", { params }),
  manage: (params) => apiInstance.get("/coupon/manage", { params }),
  create: (payload) => apiInstance.post("/coupon", payload),
  update: (id, payload) => apiInstance.put(`/coupon/${id}`, payload),
  remove: (id) => apiInstance.delete(`/coupon/${id}`),
  validate: (payload) => apiInstance.post("/coupon/validate", payload),
};

export const chatApi = {
  session: () => apiInstance.get("/chat/session"),
  mySessions: () => apiInstance.get("/chat/sessions/me"),
  get: (id) => apiInstance.get(`/chat/${id}`),
  send: (id, payload) => apiInstance.post(`/chat/${id}/message`, payload),
  resolve: (id) => apiInstance.put(`/chat/${id}/resolve`),
  vendorSessions: (params) => apiInstance.get("/chat/vendor/sessions", { params }),
  vendorProductRequests: () => apiInstance.get("/chat/vendor/product-requests"),
  vendorReply: (id, payload) => apiInstance.post(`/chat/${id}/vendor-reply`, payload),
};

export const addressApi = {
  list: () => apiInstance.get("/address"),
  create: (payload) => apiInstance.post("/address", payload),
  update: (id, payload) => apiInstance.put(`/address/${id}`, payload),
  setDefault: (id) => apiInstance.patch(`/address/${id}/default`),
  remove: (id) => apiInstance.delete(`/address/${id}`),
};

export const categoryApi = {
  list: (params) => apiInstance.get("/category", { params }),
  getBySlug: (slug) => apiInstance.get(`/category/${slug}`),
  create: (payload) => apiInstance.post("/category", payload),
  update: (id, payload) => apiInstance.put(`/category/${id}`, payload),
};

export const mediaApi = {
  list: (params) => apiInstance.get("/media", { params }),
  upload: (formData) =>
    apiInstance.post("/media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => apiInstance.delete(`/media/${id}`),
};

export const payoutApi = {
  // Vendor
  balance: () => apiInstance.get("/payout/balance"),
  mine: () => apiInstance.get("/payout/mine"),
  request: (payload) => apiInstance.post("/payout", payload),
  cancel: (id) => apiInstance.delete(`/payout/${id}`),
  // Admin
  list: (params) => apiInstance.get("/payout", { params }),
  pay: (id, payload) => apiInstance.put(`/payout/${id}/pay`, payload),
  reject: (id, payload) => apiInstance.put(`/payout/${id}/reject`, payload),
};

export const notificationApi = {
  list: (params) => apiInstance.get("/notification", { params }),
  unreadCount: () => apiInstance.get("/notification/unread-count"),
  markRead: (id) => apiInstance.put(`/notification/${id}/read`),
  markAllRead: () => apiInstance.put("/notification/read-all"),
};

/** Admin + vendor historical daily reports */
export const reportApi = {
  daily: (params) => apiInstance.get("/dashboard/daily-report", { params }),
  dayDetail: (date) =>
    apiInstance.get("/dashboard/daily-report", { params: { date } }),
};

/** Company master catalog (brand → product → models) */
export const catalogApi = {
  brands: (params) => apiInstance.get("/catalog/brands", { params }),
  list: (params) => apiInstance.get("/catalog", { params }),
  getById: (id) => apiInstance.get(`/catalog/${id}`),
  create: (payload) => apiInstance.post("/catalog", payload),
  update: (id, payload) => apiInstance.put(`/catalog/${id}`, payload),
  remove: (id) => apiInstance.delete(`/catalog/${id}`),
};

export const userApi = {
  getById: (id) => apiInstance.get(`/user/${id}`),
  update: (id, payload) => apiInstance.put(`/user/updateUser/${id}`, payload),
  list: (params) => apiInstance.get("/user/admin/users", { params }),
  toggleStatus: (id, isActive) =>
    apiInstance.patch(`/user/admin/users/${id}/status`, { isActive }),
  remove: (id) => apiInstance.delete(`/user/deleteUser/${id}`),
};
