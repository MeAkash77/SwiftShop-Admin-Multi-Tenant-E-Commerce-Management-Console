/**
 * Address controller — customer address book + resolveShippingAddressForOrder helper.
 */
import Address from "../models/addressModel.js";

function normalizeAddressPayload(body = {}) {
  return {
    fullName: String(body.fullName || body.name || "").trim(),
    phone: String(body.phone || "").trim(),
    pincode: String(body.pincode || "").trim(),
    locality: String(body.locality || "").trim(),
    addressLine: String(body.addressLine || body.address || "").trim(),
    city: String(body.city || "").trim(),
    state: String(body.state || "").trim(),
    addressType: ["Home", "Work", "Other"].includes(body.addressType || body.type)
      ? body.addressType || body.type
      : "Home",
    isDefault: Boolean(body.isDefault),
  };
}

function validateRequired(data) {
  const required = [
    "fullName",
    "phone",
    "pincode",
    "locality",
    "addressLine",
    "city",
    "state",
  ];
  for (const key of required) {
    if (!data[key]) {
      throw new Error(`${key} is required`);
    }
  }
  if (!/^\d{6}$/.test(data.pincode)) {
    throw new Error("Pincode must be a 6-digit number");
  }
  const phoneDigits = data.phone.replace(/\D/g, "").slice(-10);
  if (!/^\d{10}$/.test(phoneDigits)) {
    throw new Error("Phone must be a 10-digit mobile number");
  }
  data.phone = phoneDigits;
}

export const listAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ customer: req.user.id }).sort({
      isDefault: -1,
      updatedAt: -1,
    });
    return res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAddress = async (req, res) => {
  try {
    const data = normalizeAddressPayload(req.body);
    validateRequired(data);

    const count = await Address.countDocuments({ customer: req.user.id });
    if (count === 0) data.isDefault = true;

    if (data.isDefault) {
      await Address.updateMany(
        { customer: req.user.id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      ...data,
      customer: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Address saved.",
      data: address,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    const data = normalizeAddressPayload({ ...address.toObject(), ...req.body });
    validateRequired(data);

    if (data.isDefault) {
      await Address.updateMany(
        { customer: req.user.id, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );
    }

    Object.assign(address, data);
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated.",
      data: address,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      customer: req.user.id,
    });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    if (address.isDefault) {
      const next = await Address.findOne({ customer: req.user.id }).sort({
        updatedAt: -1,
      });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    await Address.updateMany(
      { customer: req.user.id },
      { $set: { isDefault: false } }
    );
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated.",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Shared helper for order create — accept addressId or inline shippingAddress */
export async function resolveShippingAddressForOrder(customerId, body = {}) {
  if (body.addressId) {
    const saved = await Address.findOne({
      _id: body.addressId,
      customer: customerId,
    });
    if (!saved) {
      throw new Error("Selected delivery address was not found. Please add or choose an address.");
    }
    return {
      fullName: saved.fullName,
      phone: saved.phone,
      pincode: saved.pincode,
      locality: saved.locality,
      addressLine: saved.addressLine,
      city: saved.city,
      state: saved.state,
      addressType: saved.addressType,
    };
  }

  if (body.shippingAddress && typeof body.shippingAddress === "object") {
    const data = normalizeAddressPayload(body.shippingAddress);
    validateRequired(data);
    return {
      fullName: data.fullName,
      phone: data.phone,
      pincode: data.pincode,
      locality: data.locality,
      addressLine: data.addressLine,
      city: data.city,
      state: data.state,
      addressType: data.addressType,
    };
  }

  throw new Error("Please add a delivery address before placing your order.");
}
