/**
 * React entry — Redux Provider, global CSS, Font Awesome, mounts <App />.
 * Also warm the API in the background so the first shop request rarely cold-starts.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import store from "./app/store.js";
import "@fortawesome/fontawesome-free/css/all.min.css";

const apiBase = import.meta.env.DEV
  ? ""
  : String(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
if (typeof fetch === "function") {
  const healthUrl = apiBase ? `${apiBase}/health` : "/health";
  const productUrl = apiBase
    ? `${apiBase}/api/product?status=active&page=1&limit=12&sort=newest`
    : "/api/product?status=active&page=1&limit=12&sort=newest";
  // Fire-and-forget: wake serverless + Mongo while React boots
  fetch(healthUrl, { cache: "no-store" }).catch(() => {});
  fetch(productUrl, { cache: "default" }).catch(() => {});
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
