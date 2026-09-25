const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// GET CURRENT USER
// ============================================

router.get("/me", authMiddleware, async (req, res) => {
    try {

        const user = await User.findById(
            req.user.userId
        ).select("-password");


        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });
        }


        res.status(200).json(user);

    } catch (error) {

        console.error(
            "Get profile error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
});


// ============================================
// UPDATE CURRENT USER
// ============================================

router.put("/me", authMiddleware, async (req, res) => {
    try {

        const {
            name,
            email
        } = req.body;


        if (!name || !name.trim()) {

            return res.status(400).json({
                message: "Name is required"
            });
        }


        if (!email || !email.trim()) {

            return res.status(400).json({
                message: "Email is required"
            });
        }


        const updatedUser =
            await User.findByIdAndUpdate(

                req.user.userId,

                {
                    name: name.trim(),
                    email: email.trim().toLowerCase()
                },

                {
                    new: true,
                    runValidators: true
                }
            ).select("-password");


        if (!updatedUser) {

            return res.status(404).json({
                message: "User not found"
            });
        }


        res.status(200).json({

            message: "Profile updated successfully",

            user: updatedUser
        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );


        // Duplicate email
        if (error.code === 11000) {

            return res.status(400).json({
                message: "Email is already in use"
            });
        }


        res.status(500).json({
            message: "Failed to update profile"
        });
    }
});

router.put("/change-password", authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const bcrypt = require("bcryptjs");

        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        await user.save();

        res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);

        res.status(500).json({
            message: "Failed to change password"
        });
    }
});


module.exports = router;