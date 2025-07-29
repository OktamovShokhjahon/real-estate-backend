const express = require("express");
const PropertyReview = require("../models/PropertyReview");
const TenantReview = require("../models/TenantReview");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get user's reviews
router.get("/my-reviews", auth, async (req, res) => {
  try {
    const [propertyReviews, tenantReviews] = await Promise.all([
      PropertyReview.find({ author: req.user._id }).sort({ createdAt: -1 }),
      TenantReview.find({ author: req.user._id }).sort({ createdAt: -1 }),
    ]);

    res.json({
      propertyReviews,
      tenantReviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user dashboard stats
router.get("/dashboard", auth, async (req, res) => {
  try {
    const [propertyReviewsCount, tenantReviewsCount] = await Promise.all([
      PropertyReview.countDocuments({ author: req.user._id }),
      TenantReview.countDocuments({ author: req.user._id }),
    ]);

    res.json({
      propertyReviewsCount,
      tenantReviewsCount,
      totalReviews: propertyReviewsCount + tenantReviewsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user notification preferences
router.patch("/notifications", auth, async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    if (typeof emailNotifications !== "boolean") {
      return res
        .status(400)
        .json({ message: "emailNotifications must be a boolean" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { emailNotifications },
      { new: true, select: "emailNotifications" }
    );

    res.json({
      message: "Notification preferences updated successfully",
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user notification preferences
router.get("/notifications", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id, "emailNotifications");
    res.json({ emailNotifications: user.emailNotifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
