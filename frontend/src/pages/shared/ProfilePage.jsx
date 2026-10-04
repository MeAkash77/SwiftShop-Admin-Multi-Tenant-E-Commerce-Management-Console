import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { userApi } from "../../api/services";
import { setUser } from "../../features/user/userSlice";
import useNotify from "../../hooks/useNotify";

const ProfilePage = ({ roleLabel, changePasswordPath }) => {
  const dispatch = useDispatch();
  const notify = useNotify();
  const authUser = useSelector((state) => state.user.user);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);

  const passwordLink =
    changePasswordPath ||
    (roleLabel === "Admin"
      ? "/admin/change-password"
      : roleLabel === "Vendor"
        ? "/vendor/change-password"
        : null);

  useEffect(() => {
    async function load() {
      try {
        const response = await userApi.getById(authUser.id);
        const user = response.data.user || response.data.data || response.data;
        setForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          email: user.email || "",
        });
      } catch (err) {
        notify.fromError(err, "Failed to load profile.");
      }
    }

    if (authUser?.id) load();
  }, [authUser?.id]);

  function updateField(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await userApi.update(authUser.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
      });
      const updated = response.data.user || response.data.data || response.data;
      dispatch(
        setUser({
          ...authUser,
          firstName: updated.firstName,
          lastName: updated.lastName,
        })
      );
      notify.success("Profile updated successfully.");
    } catch (err) {
      notify.fromError(err, "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack-gap">
      <div>
        <h2 className="page-title">{roleLabel} Profile</h2>
        <p className="page-subtitle">Update your account details.</p>
      </div>

      <div className="form-card">
        <h3>Account Details</h3>
        <form className="panel-form" onSubmit={saveProfile}>
          <input
            name="firstName"
            value={form.firstName}
            onChange={updateField}
            placeholder="First name"
            required
          />
          <input
            name="lastName"
            value={form.lastName}
            onChange={updateField}
            placeholder="Last name"
            required
          />
          <input name="email" value={form.email} disabled />
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={updateField}
            placeholder="Phone number"
          />
          <button className="panel-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {passwordLink ? (
        <div className="form-card">
          <h3>Security</h3>
          <p className="muted">
            Keep your account secure with a strong password.
          </p>
          <Link className="panel-btn" to={passwordLink} style={{ display: "inline-flex" }}>
            Change Password
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default ProfilePage;
