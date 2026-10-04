import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { pushToast } from "../features/notification/notificationSlice";

/**
 * Real-world style toast notifications for success/error/info/warning.
 */
export default function useNotify() {
  const dispatch = useDispatch();

  const notify = useCallback(
    (type, message, options = {}) => {
      dispatch(
        pushToast({
          type,
          message,
          title: options.title,
          duration: options.duration,
        })
      );
    },
    [dispatch]
  );

  return {
    success: (message, options) => notify("success", message, options),
    error: (message, options) => notify("error", message, options),
    info: (message, options) => notify("info", message, options),
    warning: (message, options) => notify("warning", message, options),
    fromError: (err, fallback = "Something went wrong.") =>
      notify("error", err?.response?.data?.message || err?.message || fallback),
  };
}
