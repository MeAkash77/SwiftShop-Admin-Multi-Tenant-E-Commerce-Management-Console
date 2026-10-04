import cloudinary from "../configs/cloudinary.js";

const PRESETS = {
  products: {
    folder: "products",
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
  },
  reviews: {
    folder: "reviews",
    transformation: [
      {
        width: 800,
        height: 800,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
  },
  banners: {
    folder: "banners",
    transformation: [
      {
        width: 1600,
        height: 420,
        crop: "fill",
        gravity: "auto",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
  },
};

/**
 * Upload a buffer to Cloudinary with consistent sizing for the UI.
 * @param {Buffer} fileBuffer
 * @param {"products"|"reviews"|"banners"} preset
 */
const uploadToCloudinary = async (fileBuffer, preset = "products") => {
  const config = PRESETS[preset] || PRESETS.products;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: config.folder,
          transformation: config.transformation,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(fileBuffer);
  });
};

export default uploadToCloudinary;
