/**
 * Route guard — requires login + allowed roles; redirects to role login/home.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, roles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, user, token } = useSelector((state) => state.user);

  if (!isAuthenticated || !token) {
    const loginPath =
      roles.length === 1 && roles[0] === "superAdmin"
        ? "/admin/login"
        : roles.length === 1 && roles[0] === "vendor"
          ? "/vendor/login"
          : "/login";
    return (
      <Navigate to={loginPath} replace state={{ from: location }} />
    );
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    const home =
      user?.role === "superAdmin"
        ? "/admin/dashboard"
        : user?.role === "vendor"
          ? "/vendor"
          : "/customer";
    return <Navigate to={home} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
