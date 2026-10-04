/**
 * User admin ops — list/update/toggle/delete users (Super Admin).
 */
import User from "../models/userModel.js";

// get all users
export const getAllUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status === "active") filter.isActive = true;
        if (req.query.status === "inactive") filter.isActive = false;

        const users = await User.find(filter)
            .select("-password -refreshToken")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

//get user by id 
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        if (
            req.user.role !== "superAdmin" && req.user.id !== userId) {
            return res.status(403).json({
                message: "Access denied",
            });
        }
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

//updtae user by id
export const updateUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = { ...req.body };
        if (req.user.role !== "superAdmin" && req.user.id !== userId) {
            return res.status(403).json({
                message: "Access Denied",
            });
        }

        delete updateData.role;
        delete updateData.refreshToken;
        delete updateData.password;

        // Only superAdmin can change active status
        if (req.user.role !== "superAdmin") {
            delete updateData.isActive;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { returnDocument: "after" }).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// Activate / Deactivate user (superAdmin only)
export const toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                message: "isActive must be true or false"
            });
        }

        if (String(req.user.id) === String(userId)) {
            return res.status(400).json({
                message: "You cannot deactivate your own account"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.isActive = isActive;
        if (!isActive) {
            user.refreshToken = null;
        }
        await user.save();

        return res.status(200).json({
            success: true,
            message: isActive ? "User activated successfully" : "User deactivated successfully",
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                firstName: user.firstName,
                lastName: user.lastName,
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

// delete user by id
export const deleteUserById = async (req, res) => {
    try {
        if (req.user.role !== "superAdmin") {
            return res.status(403).json({
                message: "Only admin can delete users"
            });
        }
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
