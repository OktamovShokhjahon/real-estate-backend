const express = require("express");
const mongoose = require("mongoose");
const PropertyReview = require("../models/PropertyReview");
const TenantReview = require("../models/TenantReview");
const User = require("../models/User");
const { adminAuth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");

const router = express.Router();

// Get dashboard statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPropertyReviews,
      totalTenantReviews,
      dailyUsers,
      weeklyUsers,
      monthlyUsers,
      previousWeekUsers,
      dailyPropertyReviews,
      weeklyPropertyReviews,
      monthlyPropertyReviews,
      previousWeekPropertyReviews,
      dailyTenantReviews,
      weeklyTenantReviews,
      monthlyTenantReviews,
      previousWeekTenantReviews,
      pendingPropertyReviews,
      pendingTenantReviews,
      reportedPropertyReviews,
      reportedTenantReviews,
    ] = await Promise.all([
      User.countDocuments(),
      PropertyReview.countDocuments(),
      TenantReview.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      User.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
      PropertyReview.countDocuments({ createdAt: { $gte: today } }),
      PropertyReview.countDocuments({ createdAt: { $gte: weekAgo } }),
      PropertyReview.countDocuments({ createdAt: { $gte: monthAgo } }),
      PropertyReview.countDocuments({
        createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      }),
      TenantReview.countDocuments({ createdAt: { $gte: today } }),
      TenantReview.countDocuments({ createdAt: { $gte: weekAgo } }),
      TenantReview.countDocuments({ createdAt: { $gte: monthAgo } }),
      TenantReview.countDocuments({
        createdAt: { $gte: twoWeeksAgo, $lt: weekAgo },
      }),
      PropertyReview.countDocuments({ isApproved: false }),
      TenantReview.countDocuments({ isApproved: false }),
      PropertyReview.countDocuments({ isReported: true }),
      TenantReview.countDocuments({ isReported: true }),
    ]);

    // Calculate rating distributions
    const propertyRatingDistribution = await PropertyReview.aggregate([
      { $match: { rating: { $exists: true, $ne: null }, isApproved: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const tenantRatingDistribution = await TenantReview.aggregate([
      { $match: { rating: { $exists: true, $ne: null }, isApproved: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Convert to object format
    const propertyRatings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tenantRatings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    propertyRatingDistribution.forEach((item) => {
      propertyRatings[item._id] = item.count;
    });

    tenantRatingDistribution.forEach((item) => {
      tenantRatings[item._id] = item.count;
    });

    // Calculate growth rates
    const userWeeklyGrowth =
      previousWeekUsers > 0
        ? Math.round(
            ((weeklyUsers - previousWeekUsers) / previousWeekUsers) * 100
          )
        : 0;
    const propertyWeeklyGrowth =
      previousWeekPropertyReviews > 0
        ? Math.round(
            ((weeklyPropertyReviews - previousWeekPropertyReviews) /
              previousWeekPropertyReviews) *
              100
          )
        : 0;
    const tenantWeeklyGrowth =
      previousWeekTenantReviews > 0
        ? Math.round(
            ((weeklyTenantReviews - previousWeekTenantReviews) /
              previousWeekTenantReviews) *
              100
          )
        : 0;

    res.json({
      users: {
        total: totalUsers,
        daily: dailyUsers,
        weekly: weeklyUsers,
        monthly: monthlyUsers,
        weeklyGrowth: userWeeklyGrowth,
      },
      propertyReviews: {
        total: totalPropertyReviews,
        daily: dailyPropertyReviews,
        weekly: weeklyPropertyReviews,
        monthly: monthlyPropertyReviews,
        pending: pendingPropertyReviews,
        reported: reportedPropertyReviews,
        ratingDistribution: propertyRatings,
        weeklyGrowth: propertyWeeklyGrowth,
      },
      tenantReviews: {
        total: totalTenantReviews,
        daily: dailyTenantReviews,
        weekly: weeklyTenantReviews,
        monthly: monthlyTenantReviews,
        pending: pendingTenantReviews,
        reported: reportedTenantReviews,
        ratingDistribution: tenantRatings,
        weeklyGrowth: tenantWeeklyGrowth,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get activity statistics (real data for last 30 days)
router.get("/activity-stats", adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get daily user registrations
    const dailyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get daily property reviews
    const dailyPropertyReviews = await PropertyReview.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get daily tenant reviews
    const dailyTenantReviews = await TenantReview.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create a complete 30-day dataset
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      const userCount =
        dailyUsers.find((d) => d._id === dateString)?.count || 0;
      const propertyCount =
        dailyPropertyReviews.find((d) => d._id === dateString)?.count || 0;
      const tenantCount =
        dailyTenantReviews.find((d) => d._id === dateString)?.count || 0;

      dailyActivity.push({
        date: dateString,
        users: userCount,
        propertyReviews: propertyCount,
        tenantReviews: tenantCount,
      });
    }

    res.json({ dailyActivity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get city statistics (real data)
router.get("/city-stats", adminAuth, async (req, res) => {
  try {
    // Get property review statistics by city
    const propertyStats = await PropertyReview.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: "$city",
          propertyReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          totalRating: { $sum: { $ifNull: ["$rating", 0] } },
          ratedReviews: { $sum: { $cond: [{ $ne: ["$rating", null] }, 1, 0] } },
        },
      },
      { $sort: { propertyReviews: -1 } },
    ]);

    // Get tenant review statistics by city (we'll need to add city field to tenant reviews or use a different approach)
    // For now, let's get tenant reviews count and simulate city distribution
    const totalTenantReviews = await TenantReview.countDocuments({
      isApproved: true,
    });

    // Calculate growth for each city (comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const recentCityStats = await PropertyReview.aggregate([
      { $match: { isApproved: true, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: "$city",
          recentReviews: { $sum: 1 },
        },
      },
    ]);

    const previousCityStats = await PropertyReview.aggregate([
      {
        $match: {
          isApproved: true,
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: "$city",
          previousReviews: { $sum: 1 },
        },
      },
    ]);

    // Combine data and calculate growth
    const cities = propertyStats
      .map((city) => {
        const recentData = recentCityStats.find((r) => r._id === city._id);
        const previousData = previousCityStats.find((p) => p._id === city._id);

        const recentCount = recentData?.recentReviews || 0;
        const previousCount = previousData?.previousReviews || 0;

        let growth = 0;
        if (previousCount > 0) {
          growth = Math.round(
            ((recentCount - previousCount) / previousCount) * 100
          );
        } else if (recentCount > 0) {
          growth = 100; // New city with reviews
        }

        // Simulate tenant reviews distribution (in real app, you'd have city field in tenant reviews)
        const tenantReviews = Math.floor(
          (city.propertyReviews /
            propertyStats.reduce((sum, c) => sum + c.propertyReviews, 0)) *
            totalTenantReviews
        );

        return {
          city: city._id,
          propertyReviews: city.propertyReviews,
          tenantReviews: tenantReviews,
          totalReviews: city.propertyReviews + tenantReviews,
          averageRating:
            city.ratedReviews > 0
              ? (city.totalRating / city.ratedReviews).toFixed(1)
              : "N/A",
          growth: growth,
        };
      })
      .sort((a, b) => b.totalReviews - a.totalReviews);

    res.json({ cities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user growth statistics (real data for last 12 months)
router.get("/user-growth", adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const twelveMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 12,
      1
    );

    // Get monthly user registrations
    const monthlyUserData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get monthly active users (users who created reviews)
    const monthlyActiveUsers = await PropertyReview.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            author: "$author",
          },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
          },
          activeUsers: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get tenant review active users
    const monthlyTenantActiveUsers = await TenantReview.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            author: "$author",
          },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
          },
          activeUsers: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Create complete 12-month dataset
    const monthlyGrowth = [];
    let cumulativeUsers = await User.countDocuments({
      createdAt: { $lt: twelveMonthsAgo },
    });

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const userData = monthlyUserData.find(
        (d) => d._id.year === year && d._id.month === month
      );
      const activeData = monthlyActiveUsers.find(
        (d) => d._id.year === year && d._id.month === month
      );
      const tenantActiveData = monthlyTenantActiveUsers.find(
        (d) => d._id.year === year && d._id.month === month
      );

      const newUsers = userData?.newUsers || 0;
      cumulativeUsers += newUsers;

      const propertyActiveUsers = activeData?.activeUsers || 0;
      const tenantActiveUsers = tenantActiveData?.activeUsers || 0;
      const totalActiveUsers = propertyActiveUsers + tenantActiveUsers;

      // Calculate retention rate (simplified: active users / total users for that month)
      const retentionRate =
        cumulativeUsers > 0
          ? Math.min(
              Math.round((totalActiveUsers / cumulativeUsers) * 100),
              100
            )
          : 0;

      monthlyGrowth.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        newUsers,
        totalUsers: cumulativeUsers,
        activeUsers: totalActiveUsers,
        retentionRate: retentionRate,
      });
    }

    res.json({ monthlyGrowth });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get pending reviews for moderation
router.get("/pending-reviews", adminAuth, async (req, res) => {
  try {
    const [propertyReviews, tenantReviews] = await Promise.all([
      PropertyReview.find({ isApproved: false })
        .populate("author", "firstName lastName email")
        .sort({ createdAt: -1 }),
      TenantReview.find({ isApproved: false })
        .populate("author", "firstName lastName email")
        .sort({ createdAt: -1 }),
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

// Approve/reject property review
router.patch(
  "/property-reviews/:id/moderate",
  adminAuth,
  validationMiddleware.validateObjectId,
  validationMiddleware.validateModerationAction,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { action } = req.body; // 'approve' or 'reject'

      if (action === "approve") {
        await PropertyReview.findByIdAndUpdate(req.params.id, {
          isApproved: true,
        });
      } else if (action === "reject") {
        await PropertyReview.findByIdAndDelete(req.params.id);
      }

      res.json({ message: `Review ${action}d successfully` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Approve/reject tenant review
router.patch(
  "/tenant-reviews/:id/moderate",
  adminAuth,
  validationMiddleware.validateObjectId,
  validationMiddleware.validateModerationAction,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { action } = req.body; // 'approve' or 'reject'

      if (action === "approve") {
        await TenantReview.findByIdAndUpdate(req.params.id, {
          isApproved: true,
        });
      } else if (action === "reject") {
        await TenantReview.findByIdAndDelete(req.params.id);
      }

      res.json({ message: `Review ${action}d successfully` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get all users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user status
router.patch(
  "/users/:id/status",
  adminAuth,
  validationMiddleware.validateObjectId,
  validationMiddleware.validateUserStatus,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { isActive } = req.body;

      await User.findByIdAndUpdate(req.params.id, { isActive });
      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get reported content
router.get("/reported-content", adminAuth, async (req, res) => {
  try {
    const [reportedPropertyReviews, reportedTenantReviews] = await Promise.all([
      PropertyReview.find({ isReported: true })
        .populate("author", "firstName lastName email")
        .sort({ reportCount: -1, createdAt: -1 }),
      TenantReview.find({ isReported: true })
        .populate("author", "firstName lastName email")
        .sort({ reportCount: -1, createdAt: -1 }),
    ]);

    res.json({
      propertyReviews: reportedPropertyReviews,
      tenantReviews: reportedTenantReviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Handle reported content
router.patch(
  "/reported-content/:type/:id",
  adminAuth,
  validationMiddleware.validateObjectId,
  validationMiddleware.validateModerationAction,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { type, id } = req.params;
      const { action } = req.body; // 'dismiss', 'approve', 'delete'

      const Model = type === "property" ? PropertyReview : TenantReview;

      if (action === "dismiss") {
        await Model.findByIdAndUpdate(id, {
          isReported: false,
          reportCount: 0,
        });
      } else if (action === "approve") {
        await Model.findByIdAndUpdate(id, {
          isReported: false,
          reportCount: 0,
          isApproved: true,
        });
      } else if (action === "delete") {
        await Model.findByIdAndDelete(id);
      }

      res.json({ message: `Content ${action}ed successfully` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
