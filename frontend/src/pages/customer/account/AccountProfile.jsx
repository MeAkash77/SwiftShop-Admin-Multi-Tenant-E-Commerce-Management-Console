import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userApi } from "../../../api/services";
import { setUser } from "../../../features/user/userSlice";
import apiInstance from "../../../api/apiInstaince";

const AccountProfile = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.user.user);
  const [editing, setEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    gender: "male",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    async function load() {
      const response = await userApi.getById(authUser.id);
      const user = response.data.user || response.data.data || response.data;
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
        gender: user.gender || "male",
      });
    }
    if (authUser?.id) load().catch(console.error);
  }, [authUser?.id]);

  function updateField(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
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
      setEditing(false);
      setMessage("Profile information updated successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Profile update failed.");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      await apiInstance.patch("/auth/changePassword", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setEditingPassword(false);
      setMessage("Password updated successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Password change failed.");
    }
  }

  return (
    <div className="fk-panel">
      <div className="fk-panel-head">
        <h1>Personal Information</h1>
        <button type="button" className="fk-edit-btn" onClick={() => setEditing((v) => !v)}>
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <form className="fk-form" onSubmit={saveProfile}>
        <div className="fk-form-row">
          <input
            name="firstName"
            value={form.firstName}
            onChange={updateField}
            disabled={!editing}
            placeholder="First Name"
            required
          />
          <input
            name="lastName"
            value={form.lastName}
            onChange={updateField}
            disabled={!editing}
            placeholder="Last Name"
            required
          />
        </div>

        <p className="fk-label">Your Gender</p>
        <div className="fk-radio-row">
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={form.gender === "male"}
              disabled={!editing}
              onChange={updateField}
            />
            Male
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={form.gender === "female"}
              disabled={!editing}
              onChange={updateField}
            />
            Female
          </label>
        </div>

        {editing ? (
          <button type="submit" className="shop-btn shop-btn-primary">
            SAVE
          </button>
        ) : null}
      </form>

      <div className="fk-panel-head" style={{ marginTop: 32 }}>
        <h2>Email Address</h2>
      </div>
      <input className="fk-single-input" value={form.email} disabled />

      <div className="fk-panel-head" style={{ marginTop: 28 }}>
        <h2>Mobile Number</h2>
        <button type="button" className="fk-edit-btn" onClick={() => setEditing((v) => !v)}>
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      <input
        className="fk-single-input"
        name="phoneNumber"
        value={form.phoneNumber}
        onChange={updateField}
        disabled={!editing}
        placeholder="Mobile Number"
      />

      <div className="fk-panel-head" style={{ marginTop: 28 }}>
        <h2>FAQs</h2>
      </div>
      <div className="fk-faq">
        <details>
          <summary>What happens when I update my email address / mobile number?</summary>
          <p>
            Your login email and mobile number will be updated across MultiCommerce after verification.
          </p>
        </details>
        <details>
          <summary>When will my MultiCommerce account get updated with new email / mobile?</summary>
          <p>It updates immediately after you save and verify the new details.</p>
        </details>
        <details>
          <summary>What happens to my existing MultiCommerce account when I update?</summary>
          <p>Your orders, wishlist and account data stay linked to the same profile.</p>
        </details>
      </div>

      <div className="fk-panel-head" style={{ marginTop: 28 }}>
        <h2>Change Password</h2>
        <button
          type="button"
          className="fk-edit-btn"
          onClick={() => setEditingPassword((v) => !v)}
        >
          {editingPassword ? "Cancel" : "Edit"}
        </button>
      </div>
      {editingPassword ? (
        <form className="fk-form" onSubmit={changePassword}>
          <div className="fk-form-row">
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              placeholder="Current Password"
              required
            />
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              placeholder="New Password"
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="shop-btn shop-btn-primary">
            UPDATE PASSWORD
          </button>
        </form>
      ) : (
        <p className="shop-muted">••••••••</p>
      )}

      {message ? <p className="fk-message">{message}</p> : null}
    </div>
  );
};

export default AccountProfile;
