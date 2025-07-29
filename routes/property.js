const express = require("express");
const PropertyReview = require("../models/PropertyReview");
const { auth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");
const Filter = require("bad-words");
const { sendEmail } = require("../utils/email");
const User = require("../models/User");

const router = express.Router();
const filter = new Filter();

// Get property reviews with search and pagination
router.get(
  "/reviews",
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateSearch,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const page = Number.parseInt(req.query.page) || 1;
      const limit = Number.parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build search query
      const searchQuery = { isApproved: true };

      if (req.query.city) {
        searchQuery.city = new RegExp(req.query.city, "i");
      }
      if (req.query.street) {
        searchQuery.street = new RegExp(req.query.street, "i");
      }
      if (req.query.building) {
        searchQuery.building = new RegExp(req.query.building, "i");
      }
      if (req.query.rooms) {
        searchQuery.numberOfRooms = Number.parseInt(req.query.rooms);
      }

      const reviews = await PropertyReview.find(searchQuery)
        .populate("author", "firstName lastName")
        .populate("comments.author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PropertyReview.countDocuments(searchQuery);

      res.json({
        reviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Create property review
router.post(
  "/reviews",
  auth,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validatePropertyReview,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const reviewData = req.body;

      // Filter profanity
      reviewData.reviewText = filter.clean(reviewData.reviewText);
      reviewData.landlordName = filter.clean(reviewData.landlordName);

      const review = new PropertyReview({
        ...reviewData,
        author: req.user._id,
      });

      await review.save();
      await review.populate("author", "firstName lastName");

      res.status(201).json(review);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Add comment to property review
router.post(
  "/reviews/:id/comments",
  auth,
  validationMiddleware.validateObjectId,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateComment,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const review = await PropertyReview.findById(req.params.id).populate(
        "author"
      );
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      const commentText = filter.clean(req.body.text);

      review.comments.push({
        author: req.user._id,
        text: commentText,
      });

      await review.save();
      await review.populate("comments.author", "firstName lastName");

      // Send email notification to the review author if not the commenter
      if (
        review.author &&
        review.author.email &&
        review.author._id.toString() !== req.user._id.toString()
      ) {
        const postLink = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/property/${review._id}`;
        await sendEmail({
          to: review.author.email,
          subject: "New reply to your property review",
          text: `Someone replied to your property review. View it here: ${postLink}`,
          html: `<p>Someone replied to your property review. <a href='${postLink}'>View the reply</a></p>`,
        });
      }

      res.status(201).json(review.comments[review.comments.length - 1]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Report property review
router.post(
  "/reviews/:id/report",
  auth,
  validationMiddleware.validateObjectId,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const review = await PropertyReview.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      review.reportCount += 1;
      if (review.reportCount >= 3) {
        review.isReported = true;
      }

      await review.save();
      res.json({ message: "Review reported successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Report property review comment
router.post(
  "/reviews/:reviewId/comments/:commentId/report",
  auth,
  validationMiddleware.validateObjectId,
  async (req, res) => {
    try {
      const review = await PropertyReview.findById(req.params.reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
      const comment = review.comments.id(req.params.commentId);
      if (!comment)
        return res.status(404).json({ message: "Comment not found" });
      comment.reportCount += 1;
      if (comment.reportCount >= 3) {
        comment.isReported = true;
      }
      await review.save();
      res.json({ message: "Comment reported successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
