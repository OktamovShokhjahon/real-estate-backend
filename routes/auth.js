const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");
const { sendEmail } = require("../utils/email");
const crypto = require("crypto");

const router = express.Router();

// Register
router.post(
  "/register",
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateUserRegistration,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, firstName, lastName, resend } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (resend && !existingUser.emailVerified) {
          // Resend code
          const verificationCode = Math.floor(
            100000 + Math.random() * 900000
          ).toString();
          existingUser.emailVerificationCode = verificationCode;
          existingUser.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
          await existingUser.save();
          await sendEmail({
            to: existingUser.email,
            subject: "Verify your email",
            text: `Your verification code is: ${verificationCode}`,
            html: `<p>Your verification code is: <b>${verificationCode}</b></p>`,
          });
          return res.status(200).json({ message: "Verification code resent" });
        }
        return res.status(400).json({ message: "Пользователь уже существует" });
      }

      // Create user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
      });

      // Generate verification code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save();

      // Send verification email
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Your verification code is: ${verificationCode}`,
        html: `<p>Your verification code is: <b>${verificationCode}</b></p>`,
      });

      res.status(201).json({
        message:
          "Verification code sent to your email. Please verify to complete registration.",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// Email verification endpoint
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post(
  "/login",
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateUserLogin,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Неверные учетные данные" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res
          .status(400)
          .json({ message: "Please verify your email before logging in." });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Неверные учетные данные" });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
