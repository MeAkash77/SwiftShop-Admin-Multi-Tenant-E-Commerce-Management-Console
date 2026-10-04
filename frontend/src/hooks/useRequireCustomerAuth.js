import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/** Returns true if customer is logged in; otherwise redirects to login. */
export function useRequireCustomerAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token, user } = useSelector((state) => state.user);

  const isCustomer = Boolean(
    isAuthenticated && token && user?.role === "customer"
  );

  function requireAuth(message = "Please login to continue.") {
    if (isCustomer) return true;
    alert(message);
    navigate("/login", { state: { from: location }, replace: false });
    return false;
  }

  return { isCustomer, requireAuth, user };
}
