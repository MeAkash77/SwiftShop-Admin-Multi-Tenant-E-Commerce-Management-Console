/**
 * Store controller — vendor creates/updates the single store linked to their user.
 */
import {
  createStore as createStoreService,
  getAllStores as getAllStoresService,
  getStoreById,
  getStoreByVendorId,
  updateStoreById,
  deleteStoreById,
} from "../services/storeService.js";
import { notifyVendor, notifyAdmins } from "../utils/createNotification.js";

const createStore = async (req, res) => {
  try {
    // Only superAdmin may create a store on behalf of another vendor.
    const vendorId =
      req.user?.role === "superAdmin" && req.body.vendorId
        ? req.body.vendorId
        : req.user?.id;
    const { storeName, email, description, phone, address } = req.body;

    if (!storeName || !email || !vendorId) {
      return res.status(400).json({
        message: "storeName, email and vendorId are required",
      });
    }

    const store = await createStoreService({
      storeName,
      email,
      vendorId,
      description: description || `${storeName} store`,
      phone: phone || "N/A",
      address: address || "N/A",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    });

    notifyAdmins({
      type: "store.created",
      title: "New store registered",
      body: `${store.storeName} is ready for review.`,
      link: `/admin/stores/${store._id}`,
      entityType: "store",
      entityId: store._id,
      store: store._id,
    });

    return res.status(201).json({
      success: true,
      data: store,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getAllStores = async (req, res) => {
  try {
    const stores = await getAllStoresService();

    return res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getStore = async (req, res) => {
  try {
    const store = await getStoreById(req.params.id);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: store,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getStoreByVendor = async (req, res) => {
  try {
    if (
      req.user?.role === "vendor" &&
      String(req.params.vendorId) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const store = await getStoreByVendorId(req.params.vendorId);

    if (!store) {
      return res.status(404).json({
        message: "Store not found for this vendor",
      });
    }

    return res.status(200).json({
      success: true,
      data: store,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const updateStore = async (req, res) => {
  try {
    const before = await getStoreById(req.params.id);

    if (!before) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    if (
      req.user?.role === "vendor" &&
      String(before.vendorId) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Vendors cannot reassign a store to another owner.
    if (req.user?.role === "vendor") {
      delete req.body.vendorId;
    }

    const store = await updateStoreById(req.params.id, req.body);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    if (
      before &&
      typeof req.body.isActive === "boolean" &&
      before.isActive !== store.isActive
    ) {
      const suspended = store.isActive === false;
      notifyVendor(store.vendorId, {
        type: suspended ? "store.suspended" : "store.reinstated",
        title: suspended ? "Store suspended" : "Store reinstated",
        body: suspended
          ? "Your store was suspended by an admin. Contact support if this is unexpected."
          : "Your store is active again and visible to customers.",
        link: "/vendor/store",
        entityType: "store",
        entityId: store._id,
        store: store._id,
      });
      if (req.user?.role === "vendor") {
        notifyAdmins({
          type: "store.updated",
          title: "Store profile updated",
          body: `${store.storeName} updated their store details.`,
          link: `/admin/stores/${store._id}`,
          entityType: "store",
          entityId: store._id,
          store: store._id,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: store,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const deleteStore = async (req, res) => {
  try {
    const existing = await getStoreById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    if (
      req.user?.role === "vendor" &&
      String(existing.vendorId) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const store = await deleteStoreById(req.params.id);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export {
  createStore,
  getAllStores,
  getStore,
  getStoreByVendor,
  updateStore,
  deleteStore,
};
