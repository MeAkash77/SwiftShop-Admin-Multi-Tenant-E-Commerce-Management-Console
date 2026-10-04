/**
 * Vendor auth — register/login/logout for the vendor portal (/api/vendor/auth).
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { sendOTP } from "../services/emailService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { clearRefreshCookie, setRefreshCookie, readRefreshCookie } from "../utils/cookieOptions.js";

const VENDOR_ROLE = "vendor";

function issueVendorSession(user, res) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setRefreshCookie(res, refreshToken, "vendor");

  return { accessToken, refreshToken };
}

/** Vendor registration — use /api/vendor/auth/register (not /api/auth/register). */
export const registerVendor = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { password, firstName, lastName, phoneNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, first name and last name are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email }).select(
      "+otp.code +otp.expiresAt"
    );

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({
          success: false,
          message:
            existingUser.role === VENDOR_ROLE
              ? "Vendor already registered. Please sign in at /vendor/login."
              : "Email already registered with another account type.",
          useVendorLogin: existingUser.role === VENDOR_ROLE,
        });
      }

      if (existingUser.role && existingUser.role !== VENDOR_ROLE) {
        return res.status(409).json({
          success: false,
          message: "Email already registered with another account type.",
        });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      existingUser.password = password;
      existingUser.role = VENDOR_ROLE;
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.phoneNumber = phoneNumber;
      existingUser.otp = {
        code: otp,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      await existingUser.save();
      await sendOTP(existingUser.email, otp);

      return res.status(200).json({
        success: true,
        message:
          "Vendor account exists but is not verified. A new OTP has been sent.",
        userId: existingUser._id,
        email: existingUser.email,
        portal: "vendor",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const user = await User.create({
      email,
      password,
      role: VENDOR_ROLE,
      firstName,
      lastName,
      phoneNumber,
      otp: {
        code: otp,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOTP(user.email, otp);

    return res.status(201).json({
      success: true,
      message:
        "Vendor account created. Please verify the OTP sent to your email.",
      userId: user._id,
      email: user.email,
      portal: "vendor",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login or use another email.",
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Vendor registration failed",
    });
  }
};

/** Vendor-only login — use /api/vendor/auth/login. */
export const vendorLogin = async (req, res) => {
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

    // Exact match first, then case-insensitive fallback for older records
    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      user = await User.findOne({
        email: { $regex: `^${escaped}$`, $options: "i" },
      }).select("+password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No vendor account found for this email. Register at /vendor/register first.",
      });
    }

    if (user.role !== VENDOR_ROLE) {
      return res.status(403).json({
        success: false,
        message:
          user.role === "superAdmin"
            ? "Admins must use /admin/login."
            : "This email is registered as a customer. Use /login, or register a seller account at /vendor/register with a different email.",
        useCustomerLogin: user.role === "customer",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "Vendor account is missing a password. Please reset password or re-register.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email with the OTP before logging in.",
        email: user.email,
        requiresVerification: true,
        portal: "vendor",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your vendor account has been deactivated. Contact admin.",
      });
    }

    // Normalize stored email if it had different casing
    if (user.email !== email) {
      user.email = email;
    }

    const { accessToken, refreshToken } = issueVendorSession(user, res);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Vendor login successful",
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
      message: err.message || "Vendor login failed",
    });
  }
};

export const vendorLogout = async (req, res) => {
  try {
    const token = readRefreshCookie(req, "vendor");
    if (token) {
      await User.findOneAndUpdate(
        { refreshToken: token, role: VENDOR_ROLE },
        { refreshToken: null }
      );
    }
    clearRefreshCookie(res, "vendor");
    return res.status(200).json({
      success: true,
      message: "Vendor logged out",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Logout failed",
    });
  }
};
