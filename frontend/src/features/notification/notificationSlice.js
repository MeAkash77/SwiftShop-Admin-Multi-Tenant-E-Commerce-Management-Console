import { createSlice, nanoid } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    toasts: [],
  },
  reducers: {
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
        if (state.toasts.length > 5) {
          state.toasts.shift();
        }
      },
      prepare({ type = "info", title, message, duration = 4200 }) {
        return {
          payload: {
            id: nanoid(),
            type,
            title:
              title ||
              (type === "success"
                ? "Success"
                : type === "error"
                  ? "Error"
                  : type === "warning"
                    ? "Warning"
                    : "Notice"),
            message: message || "",
            duration,
          },
        };
      },
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const { pushToast, removeToast, clearToasts } = notificationSlice.actions;
export default notificationSlice.reducer;
