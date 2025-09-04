const express = require("express");
const PropertyReview = require("../models/PropertyReview");
const TenantReview = require("../models/TenantReview");
const RememberedAddress = require("../models/RememberedAddress");
const { auth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");
const Filter = require("bad-words");
const { sendEmail } = require("../utils/email");
const User = require("../models/User");

const router = express.Router();
const filter = new Filter();

/**
 * Миксованный поиск отзывов по адресу (квартира, ЖК, арендодатель, арендатор)
 * GET /api/property/mixed-reviews?city=...&street=...&building=...
 * Возвращает объект с тремя массивами: propertyReviews, residentialComplexReviews, landlordReviews, tenantReviews
 */
router.get(
  "/mixed-reviews",
  validationMiddleware.sanitizeInput,
  async (req, res) => {
    try {
      const page = Number.parseInt(req.query.page) || 1;
      const limit = Number.parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build base search query for address
      const addressQuery = { isApproved: true };
      if (req.query.city) {
        addressQuery.city = new RegExp(req.query.city, "i");
      }
      if (req.query.street) {
        addressQuery.street = new RegExp(req.query.street, "i");
      }
      if (req.query.building) {
        addressQuery.building = new RegExp(req.query.building, "i");
      }
      const hasAddressFilter = Boolean(
        req.query.city || req.query.street || req.query.building
      );

      // Найдём авторов, у которых есть PropertyReview по указанному адресу (только если фильтруем по адресу)
      const matchingAuthorIds = hasAddressFilter
        ? await PropertyReview.distinct("author", addressQuery)
        : [];

      // Подтянем последние адреса для этих авторов (для использования в tenant reviews)
      const propertyReviewsForAuthors = hasAddressFilter
        ? await PropertyReview.find({
            ...addressQuery,
            author: { $in: matchingAuthorIds },
          })
            .sort({ createdAt: -1 })
            .select("author city street building createdAt")
        : [];

      const authorToAddress = new Map();
      for (const pr of propertyReviewsForAuthors) {
        const key = pr.author.toString();
        if (!authorToAddress.has(key)) {
          authorToAddress.set(key, {
            city: pr.city,
            street: pr.street,
            building: pr.building,
          });
        }
      }

      // 1. Отзывы о квартирах (основные отзывы)
      const propertyReviewsPromise = PropertyReview.find({
        ...addressQuery,
        reviewType: { $in: [null, "property", undefined] }, // либо не указан, либо явно property
      })
        .populate("author", "firstName lastName")
        .populate("comments.author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then((reviews) =>
          reviews.map((review) => ({
            ...review.toObject(),
            title: `Отзыв о квартире: ${review.city}, ${review.street}, ${review.building}`,
            content: review.reviewText,
            reviewType: "property",
            comments: review.comments?.map((comment) => ({
              ...comment.toObject(),
              content: comment.text,
            })),
          }))
        );

      // 2. Отзывы о ЖК
      const residentialComplexReviewsPromise = PropertyReview.find({
        ...addressQuery,
        reviewType: "residentialComplex",
      })
        .populate("author", "firstName lastName")
        .populate("comments.author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then((reviews) =>
          reviews.map((review) => ({
            ...review.toObject(),
            title: `Отзыв о ЖК: ${review.city}, ${review.street}, ${review.building}`,
            content: review.reviewText,
            reviewType: "residentialComplex",
            comments: review.comments?.map((comment) => ({
              ...comment.toObject(),
              content: comment.text,
            })),
          }))
        );

      // 3. Отзывы об арендодателях
      const landlordReviewsPromise = PropertyReview.find({
        ...addressQuery,
        reviewType: "landlord",
      })
        .populate("author", "firstName lastName")
        .populate("comments.author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then((reviews) =>
          reviews.map((review) => ({
            ...review.toObject(),
            title: `Отзыв об арендодателе: ${review.city}, ${review.street}, ${review.building}`,
            content: review.reviewText,
            reviewType: "landlord",
            comments: review.comments?.map((comment) => ({
              ...comment.toObject(),
              content: comment.text,
            })),
          }))
        );

      // 5. Отзывы об арендаторах (из TenantReview)
      const tenantFilter = { isApproved: true };
      if (hasAddressFilter) {
        tenantFilter.author = { $in: matchingAuthorIds };
      }
      if (req.query.idLastFour) {
        tenantFilter.tenantIdLastFour = req.query.idLastFour;
      }
      if (req.query.phoneLastFour) {
        tenantFilter.tenantPhoneLastFour = req.query.phoneLastFour;
      }

      const tenantReviewsPromise = TenantReview.find(tenantFilter)
        .populate("author", "firstName lastName")
        .populate("comments.author", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then((reviews) =>
          reviews.map((review) => {
            const addr =
              review.author &&
              authorToAddress.get(review.author._id.toString());
            return {
              ...review.toObject(),
              ...(addr || {}),
              title: `Отзыв об арендаторе: ${review.tenantFullName}`,
              content: review.reviewText,
              reviewType: "tenant",
              comments: review.comments?.map((comment) => ({
                ...comment.toObject(),
                content: comment.text,
              })),
            };
          })
        );

      // Считаем total для пагинации по каждому типу
      const [
        propertyReviews,
        residentialComplexReviews,
        landlordReviews,
        tenantReviews,
        propertyTotal,
        residentialComplexTotal,
        landlordTotal,
        tenantTotal,
      ] = await Promise.all([
        propertyReviewsPromise,
        residentialComplexReviewsPromise,
        landlordReviewsPromise,
        tenantReviewsPromise,
        PropertyReview.countDocuments({
          ...addressQuery,
          reviewType: { $in: [null, "property", undefined] },
        }),
        PropertyReview.countDocuments({
          ...addressQuery,
          reviewType: "residentialComplex",
        }),
        PropertyReview.countDocuments({
          ...addressQuery,
          reviewType: "landlord",
        }),
        TenantReview.countDocuments(tenantFilter),
      ]);

      res.json({
        propertyReviews,
        residentialComplexReviews,
        landlordReviews,
        tenantReviews,
        propertyTotal,
        residentialComplexTotal,
        landlordTotal,
        tenantTotal,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get property reviews with search and pagination (legacy, only квартиры)
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

      // Только отзывы о квартирах (reviewType: null, undefined, или "property")
      searchQuery.reviewType = { $in: [null, "property", undefined] };

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

router.post(
  "/reviews",
  auth,
  // Custom validation middleware to ensure only the main rating is required
  (req, res, next) => {
    // Validate that ratings.apartment exists and is a number between 1 and 5
    const ratings = req.body.ratings;
    if (
      !ratings ||
      typeof ratings.apartment !== "number" ||
      ratings.apartment < 1 ||
      ratings.apartment > 5
    ) {
      return res.status(400).json({
        message:
          "Основная оценка квартиры (ratings.apartment) обязательна и должна быть числом от 1 до 5.",
      });
    }
    // All other ratings are optional, but if present, must be numbers between 1 and 5
    const optionalFields = [
      "residentialComplex",
      "courtyard",
      "parking",
      "infrastructure",
    ];
    for (const field of optionalFields) {
      if (
        ratings[field] !== undefined &&
        ratings[field] !== null &&
        (typeof ratings[field] !== "number" ||
          ratings[field] < 1 ||
          ratings[field] > 5)
      ) {
        return res.status(400).json({
          message: `Оценка "${field}" должна быть числом от 1 до 5, если указана.`,
        });
      }
    }
    next();
  },
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const reviewData = req.body;

      // Clean reviewText if it exists and is a non-empty string
      if (
        reviewData.reviewText &&
        typeof reviewData.reviewText === "string" &&
        reviewData.reviewText.trim().length > 0
      ) {
        try {
          reviewData.reviewText = filter.clean(reviewData.reviewText);
        } catch (e) {
          reviewData.reviewText = reviewData.reviewText;
        }
      }

      // Clean landlordName if it exists and is a non-empty string
      if (
        reviewData.landlordName &&
        typeof reviewData.landlordName === "string" &&
        reviewData.landlordName.trim().length > 0
      ) {
        try {
          reviewData.landlordName = filter.clean(reviewData.landlordName);
        } catch (e) {
          reviewData.landlordName = reviewData.landlordName;
        }
      }

      // --- BEGIN PATCH: Ensure "rating" field is set for Mongoose validation ---
      // The PropertyReview schema requires a "rating" field.
      // We'll set it to the main apartment rating.
      // This ensures Mongoose validation passes and error in @file_context_0 is avoided.
      let reviewFields = { ...reviewData, author: req.user._id };
      if (
        reviewData.ratings &&
        typeof reviewData.ratings.apartment === "number"
      ) {
        reviewFields.rating = reviewData.ratings.apartment;
      }
      // --- END PATCH ---

      const review = new PropertyReview(reviewFields);

      await review.save();
      await review.populate("author", "firstName lastName");

      // Only update RememberedAddress if city, street, and building exist and are non-empty strings
      if (
        reviewData.city &&
        typeof reviewData.city === "string" &&
        reviewData.city.trim().length > 0 &&
        reviewData.street &&
        typeof reviewData.street === "string" &&
        reviewData.street.trim().length > 0 &&
        reviewData.building &&
        typeof reviewData.building === "string" &&
        reviewData.building.trim().length > 0
      ) {
        try {
          await RememberedAddress.findOneAndUpdate(
            {
              city: reviewData.city.trim(),
              street: reviewData.street.trim(),
              building: reviewData.building.trim(),
            },
            {
              $inc: { usageCount: 1 },
              $set: { lastUsed: new Date() },
            },
            {
              upsert: true,
              new: true,
            }
          );
        } catch (addressError) {
          console.error("Error saving remembered address:", addressError);
          // Don't fail the review creation if address saving fails
        }
      }

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
        review.author._id.toString() !== req.user._id.toString() &&
        review.author.emailNotifications !== false
      ) {
        const postLink = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/property/${review._id}`;

        // Get commenter's name
        const commenterName = `${req.user.firstName} ${req.user.lastName}`;

        // Truncate comment text for preview (first 100 characters)
        const commentPreview =
          commentText.length > 100
            ? commentText.substring(0, 100) + "..."
            : commentText;

        try {
          console.log(
            `Sending email notification to ${review.author.email} for comment on property review ${review._id}`
          );
          await sendEmail({
            to: review.author.email,
            subject: `New comment on your property review from ${commenterName}`,
            text: `Hi ${review.author.firstName},\n\n${commenterName} commented on your property review:\n\n"${commentPreview}"\n\nView the full comment and reply here: ${postLink}\n\nBest regards,\nProkvartiru.kz Team`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Comment on Your Property Review</h2>
                <p>Hi ${review.author.firstName},</p>
                <p><strong>${commenterName}</strong> commented on your property review:</p>
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
