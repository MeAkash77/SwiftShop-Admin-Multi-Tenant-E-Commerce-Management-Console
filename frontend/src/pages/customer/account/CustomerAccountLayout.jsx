import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../features/user/userSlice";
import apiInstance from "../../../api/apiInstaince";

const menuGroups = [
  {
    title: "Account settings",
    icon: "fa-solid fa-user",
    items: [
      { to: "/customer/account/profile", label: "Profile Information" },
      { to: "/customer/account/addresses", label: "Manage Addresses" },
    ],
  },
  {
    title: "My stuff",
    icon: "fa-solid fa-folder",
    items: [
      { to: "/customer/account/coupons", label: "My Coupons" },
      { to: "/customer/account/reviews", label: "My Reviews & Ratings" },
      { to: "/customer/account/notifications", label: "Notifications" },
      { to: "/customer/account/wishlist", label: "My Wishlist" },
    ],
  },
];

const CustomerAccountLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  async function handleLogout() {
    try {
      await apiInstance.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  }

  return (
    <div className="fk-account">
      <aside className="fk-account-sidebar">
        <div className="fk-account-hello">
          <div className="fk-account-avatar">
            <i className="fa-solid fa-user" aria-hidden="true" />
          </div>
          <div>
            <p>Hello,</p>
            <h2>
              {user?.firstName || "Customer"} {user?.lastName || ""}
            </h2>
          </div>
        </div>

        <NavLink to="/customer/orders" className="fk-account-orders-link">
          <i className="fa-solid fa-box" aria-hidden="true" />
          <span>My orders</span>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </NavLink>

        {menuGroups.map((group) => (
          <div className="fk-account-group" key={group.title}>
            <div className="fk-account-group-title">
              <i className={group.icon} aria-hidden="true" />
              {group.title}
            </div>
            <nav>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "fk-account-link active" : "fk-account-link"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <button type="button" className="fk-account-logout" onClick={handleLogout}>
          <i className="fa-solid fa-power-off" aria-hidden="true" />
          Logout
        </button>
      </aside>

      <section className="fk-account-content">
        <Outlet />
      </section>
    </div>
  );
};

export default CustomerAccountLayout;
