const express = require("express");
const TenantReview = require("../models/TenantReview");
const { auth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");
const Filter = require("bad-words");
const { sendEmail } = require("../utils/email");
const User = require("../models/User");

const router = express.Router();
const filter = new Filter();

// Get tenant reviews with search and pagination
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

      if (req.query.name) {
        searchQuery.tenantFullName = new RegExp(req.query.name, "i");
      }
      if (req.query.idLastFour) {
        searchQuery.tenantIdLastFour = req.query.idLastFour;
      }
      if (req.query.phoneLastFour) {
        searchQuery.tenantPhoneLastFour = req.query.phoneLastFour;
      }

      const reviews = await TenantReview.find(searchQuery)
        .populate("author", "firstName lastName")
        .populate("comments.author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await TenantReview.countDocuments(searchQuery);

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

// Create tenant review
router.post(
  "/reviews",
  auth,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateTenantReview,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const reviewData = req.body;

      // Filter profanity
      reviewData.reviewText = filter.clean(reviewData.reviewText);
      reviewData.tenantFullName = filter.clean(reviewData.tenantFullName);

      const review = new TenantReview({
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

// Add comment to tenant review
router.post(
  "/reviews/:id/comments",
  auth,
  validationMiddleware.validateObjectId,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateComment,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const review = await TenantReview.findById(req.params.id).populate(
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
        review.author._id.toString() !== req.user._id.toString() &&
        review.author.emailNotifications !== false
      ) {
        const postLink = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/tenant/${review._id}`;

        // Get commenter's name
        const commenterName = `${req.user.firstName} ${req.user.lastName}`;

        // Truncate comment text for preview (first 100 characters)
        const commentPreview =
          commentText.length > 100
            ? commentText.substring(0, 100) + "..."
            : commentText;

        try {
          console.log(
            `Sending email notification to ${review.author.email} for comment on tenant review ${review._id}`
          );
          await sendEmail({
            to: review.author.email,
            subject: `New comment on your tenant review from ${commenterName}`,
            text: `Hi ${review.author.firstName},\n\n${commenterName} commented on your tenant review:\n\n"${commentPreview}"\n\nView the full comment and reply here: ${postLink}\n\nBest regards,\nProkvartiru.kz Team`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Comment on Your Tenant Review</h2>
                <p>Hi ${review.author.firstName},</p>
                <p><strong>${commenterName}</strong> commented on your tenant review:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                  <p style="margin: 0; font-style: italic;">"${commentPreview}"</p>
                </div>
                <p><a href="${postLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Comment & Reply</a></p>
                <p style="color: #666; font-size: 14px;">Best regards,<br>Prokvartiru.kz Team</p>
              </div>
            `,
          });
          console.log(
            `Email notification sent successfully to ${review.author.email}`
          );
        } catch (emailError) {
          console.error(
            "Failed to send email notification:",
            emailError.message
          );
          // Don't fail the comment creation if email fails
        }
      }

      res.status(201).json(review.comments[review.comments.length - 1]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Report tenant review
router.post(
  "/reviews/:id/report",
  auth,
  validationMiddleware.validateObjectId,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const review = await TenantReview.findById(req.params.id);
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

// Report tenant review comment
router.post(
  "/reviews/:reviewId/comments/:commentId/report",
  auth,
  validationMiddleware.validateObjectId,
  async (req, res) => {
    try {
      const review = await TenantReview.findById(req.params.reviewId);
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
