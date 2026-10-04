import store from "../app/store";
import { pushToast } from "../features/notification/notificationSlice";

/** Use from any file (including non-React helpers). Prefer useNotify() in components. */
export const notify = {
  success(message, options = {}) {
    store.dispatch(
      pushToast({ type: "success", message, title: options.title, duration: options.duration })
    );
  },
  error(message, options = {}) {
    store.dispatch(
      pushToast({ type: "error", message, title: options.title, duration: options.duration })
    );
  },
  info(message, options = {}) {
    store.dispatch(
      pushToast({ type: "info", message, title: options.title, duration: options.duration })
    );
  },
  warning(message, options = {}) {
    store.dispatch(
      pushToast({ type: "warning", message, title: options.title, duration: options.duration })
    );
  },
  fromError(err, fallback = "Something went wrong.") {
    store.dispatch(
      pushToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || fallback,
      })
    );
  },
};

export default notify;
