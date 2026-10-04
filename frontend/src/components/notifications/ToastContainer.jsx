import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../../features/notification/notificationSlice";
import "./ToastContainer.css";

const ICONS = {
  success: "fa-solid fa-circle-check",
  error: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

const ToastContainer = () => {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.notification.toasts);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration || 4200)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  if (!toasts.length) return null;

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`app-toast app-toast--${toast.type}`}
          role="status"
        >
          <i className={ICONS[toast.type] || ICONS.info} aria-hidden="true" />
          <div className="app-toast-body">
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button
            type="button"
            className="app-toast-close"
            aria-label="Dismiss"
            onClick={() => dispatch(removeToast(toast.id))}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
