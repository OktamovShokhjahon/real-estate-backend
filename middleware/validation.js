const { body, query, param, validationResult } = require("express-validator");
const { validators, sanitizers } = require("../utils/validation");

// Enhanced validation middleware with regex patterns
const validationMiddleware = {
  // User registration validation
  validateUserRegistration: [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail()
      .custom((value) => {
        if (!validators.isValidEmail(value)) {
          throw new Error("Email format is invalid");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .custom((value) => {
        if (!validators.isValidPassword(value)) {
          throw new Error(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          );
        }
        return true;
      }),
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .custom((value) => {
        if (!validators.isValidName(value)) {
          throw new Error("First name contains invalid characters");
        }
        return true;
      }),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .custom((value) => {
        if (!validators.isValidName(value)) {
          throw new Error("Last name contains invalid characters");
        }
        return true;
      }),
  ],

  // User login validation
  validateUserLogin: [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail()
      .custom((value) => {
        if (!validators.isValidEmail(value)) {
          throw new Error("Email format is invalid");
        }
        return true;
      }),
    body("password")
      .exists()
      .withMessage("Password is required")
      .isLength({ min: 1 })
      .withMessage("Password cannot be empty"),
  ],

  // Property review validation
  validatePropertyReview: [
    body("city")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("City must be between 2 and 100 characters")
      .custom((value) => {
        if (!validators.isValidCity(value)) {
          throw new Error("City name contains invalid characters");
        }
        return true;
      }),
    body("street")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Street must be between 2 and 200 characters")
      .custom((value) => {
        if (!validators.isValidStreet(value)) {
          throw new Error("Street name contains invalid characters");
        }
        return true;
      }),
    body("building")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Building must be between 1 and 50 characters")
      .custom((value) => {
        if (!validators.isValidBuilding(value)) {
          throw new Error("Building name/number contains invalid characters");
        }
        return true;
      }),
    body("floor")
      .optional()
      .custom((value) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !validators.isValidFloor(value)
        ) {
          throw new Error("Floor must be a valid number");
        }
        return true;
      }),
    body("apartmentNumber")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidApartmentNumber(value)) {
          throw new Error("Apartment number contains invalid characters");
        }
        return true;
      }),
    body("numberOfRooms")
      .isInt({ min: 1, max: 8 })
      .withMessage("Number of rooms must be between 1 and 8")
      .custom((value) => {
        if (!validators.isValidNumberOfRooms(value)) {
          throw new Error("Number of rooms is invalid");
        }
        return true;
      }),
    body("rentalPeriod.from.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("From month must be between 1 and 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("From month is invalid");
        }
        return true;
      }),
    body("rentalPeriod.from.year")
      .isInt({ min: 1900 })
      .withMessage("From year must be 1900 or later")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("From year is invalid");
        }
        return true;
      }),
    body("rentalPeriod.to.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("To month must be between 1 and 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("To month is invalid");
        }
        return true;
      }),
    body("rentalPeriod.to.year")
      .isInt({ min: 1900 })
      .withMessage("To year must be 1900 or later")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("To year is invalid");
        }
        return true;
      }),
    body("landlordName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Landlord name must be between 2 and 100 characters")
      .custom((value) => {
        if (!validators.isValidLandlordName(value)) {
          throw new Error("Landlord name contains invalid characters");
        }
        return true;
      }),
    body("reviewText")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Review text must be between 10 and 5000 characters")
      .custom((value) => {
        if (!validators.isValidReviewText(value)) {
          throw new Error("Review text contains invalid characters");
        }
        return true;
      }),
    body("rating")
      .optional()
      .custom((value) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !validators.isValidRating(value)
        ) {
          throw new Error("Rating must be between 1 and 5");
        }
        return true;
      }),
  ],

  // Tenant review validation
  validateTenantReview: [
    body("tenantFullName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tenant full name must be between 2 and 100 characters")
      .custom((value) => {
        if (!validators.isValidTenantFullName(value)) {
          throw new Error("Tenant full name contains invalid characters");
        }
        return true;
      }),
    body("tenantIdLastFour")
      .isLength({ min: 4, max: 4 })
      .withMessage("Tenant ID last four digits must be exactly 4 characters")
      .custom((value) => {
        if (!validators.isValidIdLastFour(value)) {
          throw new Error("Tenant ID last four digits must be numeric");
        }
        return true;
      }),
    body("tenantPhoneLastFour")
      .isLength({ min: 4, max: 4 })
      .withMessage("Tenant phone last four digits must be exactly 4 characters")
      .custom((value) => {
        if (!validators.isValidPhoneLastFour(value)) {
          throw new Error("Tenant phone last four digits must be numeric");
        }
        return true;
      }),
    body("rentalPeriod.from.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("From month must be between 1 and 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("From month is invalid");
        }
        return true;
      }),
    body("rentalPeriod.from.year")
      .isInt({ min: 1900 })
      .withMessage("From year must be 1900 or later")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("From year is invalid");
        }
        return true;
      }),
    body("rentalPeriod.to.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("To month must be between 1 and 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("To month is invalid");
        }
        return true;
      }),
    body("rentalPeriod.to.year")
      .isInt({ min: 1900 })
      .withMessage("To year must be 1900 or later")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("To year is invalid");
        }
        return true;
      }),
    body("reviewText")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Review text must be between 10 and 5000 characters")
      .custom((value) => {
        if (!validators.isValidReviewText(value)) {
          throw new Error("Review text contains invalid characters");
        }
        return true;
      }),
    body("rating")
      .optional()
      .custom((value) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !validators.isValidRating(value)
        ) {
          throw new Error("Rating must be between 1 and 5");
        }
        return true;
      }),
  ],

  // Comment validation
  validateComment: [
    body("text")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment text must be between 1 and 1000 characters")
      .custom((value) => {
        if (!validators.isValidCommentText(value)) {
          throw new Error("Comment text contains invalid characters");
        }
        return true;
      }),
  ],

  // Search validation
  validateSearch: [
    query("page")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidPageNumber(value)) {
          throw new Error("Page number must be a positive integer");
        }
        return true;
      }),
    query("limit")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidPageLimit(value)) {
          throw new Error("Limit must be between 1 and 50");
        }
        return true;
      }),
    query("city")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error("City search query contains invalid characters");
        }
        return true;
      }),
    query("street")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error("Street search query contains invalid characters");
        }
        return true;
      }),
    query("building")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error("Building search query contains invalid characters");
        }
        return true;
      }),
    query("name")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error("Name search query contains invalid characters");
        }
        return true;
      }),
    query("idLastFour")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidIdLastFour(value)) {
          throw new Error("ID last four digits must be numeric");
        }
        return true;
      }),
    query("phoneLastFour")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidPhoneLastFour(value)) {
          throw new Error("Phone last four digits must be numeric");
        }
        return true;
      }),
    query("rooms")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidNumberOfRooms(value)) {
          throw new Error("Number of rooms must be between 1 and 8");
        }
        return true;
      }),
  ],

  // Admin validation
  validateModerationAction: [
    body("action").custom((value) => {
      if (!validators.isValidModerationAction(value)) {
        throw new Error("Invalid moderation action");
      }
      return true;
    }),
  ],

  validateUserStatus: [
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
  ],

  // ObjectId validation
  validateObjectId: [
    param("id").custom((value) => {
      if (!validators.isValidObjectId(value)) {
        throw new Error("Invalid ID format");
      }
      return true;
    }),
  ],

  // Handle validation errors
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },

  // Sanitization middleware
  sanitizeInput: (req, res, next) => {
    // Sanitize common fields
    if (req.body.email) {
      req.body.email = sanitizers.sanitizeEmail(req.body.email);
    }
    if (req.body.firstName) {
      req.body.firstName = sanitizers.sanitizeName(req.body.firstName);
    }
    if (req.body.lastName) {
      req.body.lastName = sanitizers.sanitizeName(req.body.lastName);
    }
    if (req.body.city) {
      req.body.city = sanitizers.sanitizeCity(req.body.city);
    }
    if (req.body.street) {
      req.body.street = sanitizers.sanitizeStreet(req.body.street);
    }
    if (req.body.building) {
      req.body.building = sanitizers.sanitizeBuilding(req.body.building);
    }
    if (req.body.reviewText) {
      req.body.reviewText = sanitizers.sanitizeReviewText(req.body.reviewText);
    }
    if (req.body.landlordName) {
      req.body.landlordName = sanitizers.sanitizeName(req.body.landlordName);
    }
    if (req.body.tenantFullName) {
      req.body.tenantFullName = sanitizers.sanitizeName(
        req.body.tenantFullName
      );
    }
    if (req.body.text) {
      req.body.text = sanitizers.sanitizeString(req.body.text);
    }

    // Sanitize query parameters
    if (req.query.city) {
      req.query.city = sanitizers.sanitizeSearchQuery(req.query.city);
    }
    if (req.query.street) {
      req.query.street = sanitizers.sanitizeSearchQuery(req.query.street);
    }
    if (req.query.building) {
      req.query.building = sanitizers.sanitizeSearchQuery(req.query.building);
    }
    if (req.query.name) {
      req.query.name = sanitizers.sanitizeSearchQuery(req.query.name);
    }

    next();
  },
};

module.exports = validationMiddleware;
