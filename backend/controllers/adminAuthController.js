/**
 * Admin auth — login, bootstrap first Super Admin (ADMIN_SETUP_SECRET), list admins.
 */
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import envConfig from "../configs/envConfig.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { clearRefreshCookie, setRefreshCookie, readRefreshCookie } from "../utils/cookieOptions.js";

const ADMIN_ROLE = "superAdmin";

async function countAdmins() {
  return User.countDocuments({ role: ADMIN_ROLE });
}

function issueAdminSession(user, res) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setRefreshCookie(res, refreshToken, "admin");

  return { accessToken, refreshToken };
}

/** Public: whether an admin already exists (for setup UI). */
export const getAdminPortalStatus = async (req, res) => {
  try {
    const adminCount = await countAdmins();
    return res.status(200).json({
      success: true,
      hasAdmin: adminCount > 0,
      setupRequired: adminCount === 0,
      portalLoginUrl: "/admin/login",
      portalSetupUrl: "/admin/setup",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load admin portal status",
    });
  }
};

/** Admin-only login — use /api/admin/auth/login (not /api/auth/login). */
export const adminLogin = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    if (user.role !== ADMIN_ROLE) {
      return res.status(403).json({
        success: false,
        message:
          "This portal is for Super Admins only. Use /login for customers or /vendor/login for sellers.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This admin account has been deactivated.",
      });
    }

    const { accessToken, refreshToken } = issueAdminSession(user, res);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Admin login failed",
    });
  }
};

/**
 * Create a Super Admin.
 * - First admin: requires ADMIN_SETUP_SECRET (bootstrap).
 * - Later admins: requires authenticated Super Admin JWT.
 */
export const createAdmin = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { password, firstName, lastName, phoneNumber, setupSecret } =
      req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, first name and last name are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const adminCount = await countAdmins();
    const isBootstrap = adminCount === 0;

    if (isBootstrap) {
      const expected = envConfig.ADMIN_SETUP_SECRET;
      if (!expected) {
        return res.status(503).json({
          success: false,
          message:
            "ADMIN_SETUP_SECRET is not configured on the server. Add it to .env to create the first admin.",
        });
      }
      if (!setupSecret || setupSecret !== expected) {
        return res.status(403).json({
          success: false,
          message: "Invalid setup secret. Cannot create the first admin.",
        });
      }
    } else if (!req.user || req.user.role !== ADMIN_ROLE) {
      return res.status(403).json({
        success: false,
        message: "Only a Super Admin can create additional admin accounts.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Use a different email for admin.",
      });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber: phoneNumber || undefined,
      role: ADMIN_ROLE,
      isEmailVerified: true,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: isBootstrap
        ? "First Super Admin created. You can now sign in at /admin/login."
        : "Super Admin created successfully.",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create admin",
    });
  }
};

/** List Super Admin accounts (authenticated Super Admin). */
export const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: ADMIN_ROLE })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to list admins",
    });
  }
};

export const adminLogout = async (req, res) => {
  try {
    const token = readRefreshCookie(req, "admin");
    if (token) {
      await User.findOneAndUpdate(
        { refreshToken: token, role: ADMIN_ROLE },
        { refreshToken: null }
      );
    }
    clearRefreshCookie(res, "admin");
    return res.status(200).json({
      success: true,
      message: "Admin logged out",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Logout failed",
    });
  }
};
