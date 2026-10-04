/**
 * Auth controller — customer register/login, OTP verify, refresh, password reset.
 * Flows: docs/02-PROJECT-FLOW.md (section A).
 */
import User from "../models/userModel.js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import envConfig from "../configs/envConfig.js";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, generateResetToken, hashResetToken } from "../utils/generateToken.js";
import { sendOTP, sendPasswordReset } from "../services/emailService.js";
import { clearRefreshCookie, setRefreshCookie, readRefreshCookie, normalizePortal } from "../utils/cookieOptions.js";
// create  User
export const registerUser = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const { password, role, firstName, lastName, phoneNumber } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                message: "Email, password, first name and last name are required"
            });
        }

        if (role && role !== "customer") {
            return res.status(403).json({
                message:
                    role === "vendor"
                        ? "Vendors must register at the vendor portal (/vendor/register)."
                        : "This registration is for customers only.",
                useVendorPortal: role === "vendor",
            });
        }

        const safeRole = "customer";

        const existingUser = await User.findOne({ email }).select("+otp.code +otp.expiresAt");

        if (existingUser) {
            if (existingUser.isEmailVerified) {
                return res.status(409).json({
                    message: "Email already registered. Please login."
                });
            }

            if (existingUser.role && existingUser.role !== "customer") {
                return res.status(409).json({
                    message: "Email already registered with another account type."
                });
            }

            const otp = crypto.randomInt(100000, 1000000).toString();
            existingUser.password = password;
            existingUser.role = safeRole;
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.phoneNumber = phoneNumber;
            existingUser.otp = {
                code: otp,
                type: "email_verification",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            };
            await existingUser.save();
            await sendOTP(existingUser.email, otp);

            return res.status(200).json({
                message: "Account already exists but is not verified. A new OTP has been sent to your email.",
                userId: existingUser._id,
                email: existingUser.email
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const user = await User.create({
            email,
            password,
            role: safeRole,
            firstName,
            lastName,
            phoneNumber,
            otp: {
                code: otp,
                type: "email_verification",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
        });

        await sendOTP(user.email, otp);

        return res.status(201).json({
            message: "User created successfully. Please verify the OTP sent to your email.",
            userId: user._id,
            email: user.email
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                message: "Email already registered. Please login or use another email."
            });
        }

        return res.status(500).json({
            message: err.message || "Registration failed"
        });
    }
};


// Verify Email
export const verifyEmail = async (req, res) => {
    try {

        const { email, otp } = req.body;

        if (typeof email !== "string") {
            return res.status(400).json({
                message: "Invalid email"
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() })
            .select("+otp.code +otp.expiresAt");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (user.otp.expiresAt < new Date()) {
            return res.status(400).json({
                message: "OTP expired"
            });
        }

        user.isEmailVerified = true;
        await user.clearOTP();

        res.status(200).json({
            message: "Email verified successfully. You can now login."
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

//login 
export const loggedIn = async (req, res) => {

    try {
        const { email, password } = req.body;

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: "Please verify your email with the OTP before logging in.",
                email: user.email,
                requiresVerification: true
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                message: "Your account has been deactivated. Contact admin for support."
            });
        }

        if (user.role === "superAdmin") {
            return res.status(403).json({
                message: "Super Admins must sign in at the admin portal (/admin/login).",
                useAdminPortal: true,
            });
        }

        if (user.role === "vendor") {
            return res.status(403).json({
                message: "Vendors must sign in at the vendor portal (/vendor/login).",
                useVendorPortal: true,
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        setRefreshCookie(res, refreshToken, "customer");

        res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            }
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

//refreshToken API — rotates access + refresh so sessions stay valid for weeks

export const refreshToken = async (req, res) => {
    try {
        const portal = normalizePortal(
            req.body?.portal || req.headers["x-app-portal"] || "customer"
        );
        const token = readRefreshCookie(req, portal);

        if (!token) {
            return res.status(401).json({ message: "No refresh token" });
        }

        // verify refresh token
        const decoded = jwt.verify(token, envConfig.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id).select("+refreshToken");

        if (!user || !user.isActive) {
            clearRefreshCookie(res, portal);
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        if (user.refreshToken !== token) {
            // Possible reuse after rotation — clear for safety
            user.refreshToken = null;
            await user.save({ validateBeforeSave: false });
            clearRefreshCookie(res, portal);
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        setRefreshCookie(res, newRefreshToken, portal);

        return res.status(200).json({
            accessToken: newAccessToken,
            expiresIn: envConfig.JWT_ACCESS_EXPIRES || "1h",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });

    } catch (err) {
        const portal = normalizePortal(
            req.body?.portal || req.headers["x-app-portal"] || "customer"
        );
        clearRefreshCookie(res, portal);
        return res.status(403).json({ message: "Token expired or invalid" });
    }
};

//logout API
export const logout = async (req, res) => {
    try {
        const portal = normalizePortal(
            req.body?.portal || req.headers["x-app-portal"] || "customer"
        );
        const token = readRefreshCookie(req, portal);

        if (token) {
            await User.findOneAndUpdate(
                { refreshToken: token },
                { refreshToken: null }
            );
        }

        clearRefreshCookie(res, portal);

        return res.status(200).json({ message: "Logged out successfully" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


const PORTAL_ROLE_MAP = {
    customer: "customer",
    vendor: "vendor",
    admin: "superAdmin",
};

const PORTAL_LOGIN_PATH = {
    customer: "/login",
    vendor: "/vendor/login",
    admin: "/admin/login",
};

//Forgot Password (customer / vendor / admin portals)
export const forgotPassword = async (req, res) => {
    try {
        const normalizedEmail = String(req.body.email || "")
            .trim()
            .toLowerCase();
        const portal = String(req.body.portal || "customer").toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        if (!PORTAL_ROLE_MAP[portal]) {
            return res.status(400).json({
                message: "Invalid portal. Use customer, vendor, or admin."
            });
        }

        const expectedRole = PORTAL_ROLE_MAP[portal];
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email."
            });
        }

        if (user.role !== expectedRole) {
            const hint =
                user.role === "superAdmin"
                    ? "Use the admin portal forgot password page."
                    : user.role === "vendor"
                      ? "Use the vendor portal forgot password page."
                      : "Use the customer forgot password page.";
            return res.status(403).json({
                message: `This email belongs to a ${user.role === "superAdmin" ? "super admin" : user.role} account. ${hint}`,
                usePortal:
                    user.role === "superAdmin"
                        ? "admin"
                        : user.role === "vendor"
                          ? "vendor"
                          : "customer",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                message: "This account is deactivated. Contact support."
            });
        }

        const resetToken = generateResetToken();
        user.passwordResetToken = hashResetToken(resetToken);
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        const resetUrl = `${envConfig.CLIENT_URL}/resetPassword/${resetToken}?portal=${portal}`;
        const portalLabel =
            portal === "admin" ? "Admin" : portal === "vendor" ? "Vendor" : "Customer";

        await sendPasswordReset({
            to: user.email,
            portalLabel,
            resetUrl,
        });

        return res.status(200).json({
            message: "Password reset link sent to your email.",
            portal,
            loginPath: PORTAL_LOGIN_PATH[portal],
        });

    } catch (err) {
        console.log("forgotPassword error:", err);
        return res.status(500).json({
            message: err.message || "Internal Server Error"
        });
    }
};

//Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from the current password"
            });
        }

        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        user.password = newPassword;
        //Logout from all devices
        user.refreshToken = null;
        await user.save();
        clearRefreshCookie(res, "customer");
        clearRefreshCookie(res, "vendor");
        clearRefreshCookie(res, "admin");

        return res.status(200).json({
            message: "Password changed successfully. Please sign in again."
        });

    } catch (err) {
        console.log("changePassword error:", err);

        return res.status(500).json({
            message: err.message || "Internal Server Error"
        });
    }
};

//Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select("+password");

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshToken = null;

        await user.save();

        const portal =
            user.role === "superAdmin"
                ? "admin"
                : user.role === "vendor"
                  ? "vendor"
                  : "customer";

        return res.status(200).json({
            message: "Password reset successful. Please sign in with your new password.",
            portal,
            loginPath: PORTAL_LOGIN_PATH[portal],
            role: user.role,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};