/**
 * Fire-and-forget notification helpers. Never throw into the main request path.
 */
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

export async function createNotification({
  recipient,
  role,
  type,
  title,
  body = "",
  link = "",
  entityType = "",
  entityId = null,
  store = null,
}) {
  if (!recipient || !role || !type || !title) return null;
  try {
    return await Notification.create({
      recipient,
      role,
      type,
      title,
      body,
      link,
      entityType,
      entityId,
      store,
    });
  } catch (err) {
    console.error("createNotification failed:", err.message);
    return null;
  }
}

/** Notify every active superAdmin. */
export async function notifyAdmins(payload) {
  try {
    const admins = await User.find({
      role: "superAdmin",
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          ...payload,
          recipient: admin._id,
          role: "superAdmin",
        })
      )
    );
  } catch (err) {
    console.error("notifyAdmins failed:", err.message);
  }
}

/** Notify a single vendor user. */
export async function notifyVendor(vendorId, payload) {
  if (!vendorId) return;
  await createNotification({
    ...payload,
    recipient: vendorId,
    role: "vendor",
  });
}

/** Notify a single customer (the buyer). */
export async function notifyCustomer(customerId, payload) {
  if (!customerId) return;
  await createNotification({
    ...payload,
    recipient: customerId,
    role: "customer",
  });
}
