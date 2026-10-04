import storeModel from "../models/storeModel.js";

export const createStore = async (storeData) => {
  return await storeModel.create(storeData);
};

export const getAllStores = async () => {
  return await storeModel
    .find({})
    .populate("vendorId", "firstName lastName email role phoneNumber isActive")
    .sort({ createdAt: -1 });
};

export const getStoreById = async (id) => {
  return await storeModel.findById(id);
};

export const getStoreByVendorId = async (vendorId) => {
  return await storeModel.findOne({ vendorId });
};

export const updateStoreById = async (id, updateData) => {
  return await storeModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });
};

export const deleteStoreById = async (id) => {
  return await storeModel.findByIdAndDelete(id);
};