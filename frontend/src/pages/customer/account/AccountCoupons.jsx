import { useEffect, useState } from "react";
import usePagination from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import { couponApi } from "../../../api/services";
import { notify } from "../../../utils/notify";

const AccountCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await couponApi.active();
        if (!cancelled) setCoupons(res.data?.data || []);
      } catch (err) {
        if (!cancelled) {
          setCoupons([]);
          notify.fromError(err, "Could not load coupons.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(
    coupons,
    { pageSize: 8 }
  );

  function describe(coupon) {
    if (coupon.type === "fixed") {
      return `Get ₹${coupon.value} off${coupon.minOrder ? ` on orders above ₹${coupon.minOrder}` : ""}`;
    }
    return `Get ${coupon.value}% off${coupon.minOrder ? ` on orders above ₹${coupon.minOrder}` : ""}`;
  }

  function validity(coupon) {
    if (coupon.expiresAt) {
      return `Valid till ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}`;
    }
    return "No expiry date";
  }

  return (
    <div className="fk-panel">
      <div className="fk-panel-head">
        <h1>My Coupons</h1>
        <p className="muted" style={{ margin: 0 }}>
          Active platform offers. Store-specific codes appear when shopping that store —
          apply them at checkout.
        </p>
      </div>
      {loading ? <p>Loading…</p> : null}
      {!loading && coupons.length === 0 ? (
        <p>No active platform coupons right now. Check cart for a store code at checkout.</p>
      ) : null}
      <div className="fk-coupon-list">
        {pageItems.map((coupon) => (
          <div className="fk-coupon-card" key={coupon._id || coupon.code}>
            <div className="fk-coupon-code">{coupon.code}</div>
            <div>
              <h3>{describe(coupon)}</h3>
              <p>{validity(coupon)}</p>
            </div>
          </div>
        ))}
      </div>
      {coupons.length > 0 ? (
        <Pagination
          variant="shop"
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
};

export default AccountCoupons;
