const express = require("express");
const PropertyReview = require("../models/PropertyReview");
const RememberedAddress = require("../models/RememberedAddress");
const { auth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");

const router = express.Router();

// Get trending topics based on real data
router.get("/trending-topics", validationMiddleware.handleValidationErrors, async (req, res) => {
  try {
    // Get popular cities from reviews
    const cityStats = await PropertyReview.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // Get room type statistics
    const roomStats = await PropertyReview.aggregate([
      { $group: { _id: "$numberOfRooms", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 2 }
    ]);

    // Get high-rated reviews count
    const highRatedCount = await PropertyReview.countDocuments({ rating: { $gte: 4 } });

    // Get recent reviews count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await PropertyReview.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const trendingTopics = [
      // Popular cities
      ...cityStats.map((city, index) => ({
        id: `city-${index + 1}`,
        name: city._id,
        count: city.count,
        type: "city",
        href: `/property?city=${encodeURIComponent(city._id)}`
      })),
      // Room types
      ...roomStats.map((room, index) => ({
        id: `room-${index + 1}`,
        name: `${room._id}-комнатные`,
        count: room.count,
        type: "room",
        href: `/property?rooms=${room._id}`
      })),
      // High-rated reviews
      {
        id: "high-rated",
        name: "Высокий рейтинг",
        count: highRatedCount,
        type: "rating",
        href: "/property"
      },
      // Recent reviews
      {
        id: "recent",
        name: "Новые отзывы",
        count: recentCount,
        type: "recent",
        href: "/property"
      }
    ];

    res.json({ trendingTopics });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    res.status(500).json({ error: "Failed to fetch trending topics" });
  }
});

// Get recommendation statistics
router.get("/stats", validationMiddleware.handleValidationErrors, async (req, res) => {
  try {
    const totalReviews = await PropertyReview.countDocuments();
    const totalAddresses = await RememberedAddress.countDocuments();
    
    // Calculate average rating
    const ratingStats = await PropertyReview.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);
    const averageRating = ratingStats.length > 0 ? Math.round(ratingStats[0].avgRating * 10) / 10 : 0;

    // Get most popular city
    const popularCity = await PropertyReview.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const mostPopularCity = popularCity.length > 0 ? popularCity[0]._id : "Неизвестно";

    res.json({
      totalReviews,
      totalAddresses,
      averageRating,
      mostPopularCity
    });
  } catch (error) {
    console.error("Error fetching recommendation stats:", error);
    res.status(500).json({ error: "Failed to fetch recommendation stats" });
  }
});

// Get user preferences based on review history
router.get("/user-preferences", auth, validationMiddleware.handleValidationErrors, async (req, res) => {
  try {
    const userReviews = await PropertyReview.find({
      "author.firstName": req.user.firstName,
      "author.lastName": req.user.lastName
    });

    if (userReviews.length === 0) {
      return res.json(null);
    }

    // Get most common city from user's reviews
    const cityCounts = {};
    userReviews.forEach(review => {
      cityCounts[review.city] = (cityCounts[review.city] || 0) + 1;
    });

    const preferredCity = Object.keys(cityCounts).reduce((a, b) =>
      cityCounts[a] > cityCounts[b] ? a : b
    );

    res.json({
      preferredCity,
      reviewCount: userReviews.length
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});

module.exports = router;
