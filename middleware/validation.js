const { body, query, param, validationResult } = require("express-validator");
const { validators, sanitizers } = require("../utils/validation");

// Enhanced validation middleware with regex patterns
const validationMiddleware = {
  // User registration validation
  validateUserRegistration: [
    body("email")
      .isEmail()
      .withMessage("Пожалуйста, укажите корректный email адрес")
      .normalizeEmail()
      .custom((value) => {
        if (!validators.isValidEmail(value)) {
          throw new Error("Формат email неверный");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Пароль должен содержать минимум 8 символов")
      .custom((value) => {
        if (!validators.isValidPassword(value)) {
          throw new Error(
            "Пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру"
          );
        }
        return true;
      }),
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Имя должно содержать от 2 до 50 символов")
      .custom((value) => {
        if (!validators.isValidName(value)) {
          throw new Error("Имя содержит недопустимые символы");
        }
        return true;
      }),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Фамилия должна содержать от 2 до 50 символов")
      .custom((value) => {
        if (!validators.isValidName(value)) {
          throw new Error("Фамилия содержит недопустимые символы");
        }
        return true;
      }),
  ],

  // User login validation
  validateUserLogin: [
    body("email")
      .isEmail()
      .withMessage("Пожалуйста, укажите корректный email адрес")
      .normalizeEmail()
      .custom((value) => {
        if (!validators.isValidEmail(value)) {
          throw new Error("Формат email неверный");
        }
        return true;
      }),
    body("password")
      .exists()
      .withMessage("Пароль обязателен")
      .isLength({ min: 1 })
      .withMessage("Пароль не может быть пустым"),
  ],

  // Property review validation
  validatePropertyReview: [
    body("city")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Город должен содержать от 2 до 100 символов")
      .custom((value) => {
        if (!validators.isValidCity(value)) {
          throw new Error("Название города содержит недопустимые символы");
        }
        return true;
      }),
    body("street")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Улица должна содержать от 2 до 200 символов")
      .custom((value) => {
        if (!validators.isValidStreet(value)) {
          throw new Error("Название улицы содержит недопустимые символы");
        }
        return true;
      }),
    body("building")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Здание должно содержать от 1 до 50 символов")
      .custom((value) => {
        if (!validators.isValidBuilding(value)) {
          throw new Error(
            "Название/номер здания содержит недопустимые символы"
          );
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
          throw new Error("Этаж должен быть корректным числом");
        }
        return true;
      }),
    body("apartmentNumber")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidApartmentNumber(value)) {
          throw new Error("Номер квартиры содержит недопустимые символы");
        }
        return true;
      }),
    body("numberOfRooms")
      .isInt({ min: 1, max: 8 })
      .withMessage("Количество комнат должно быть от 1 до 8")
      .custom((value) => {
        if (!validators.isValidNumberOfRooms(value)) {
          throw new Error("Количество комнат неверно");
        }
        return true;
      }),
    body("rentalPeriod.from.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("Месяц начала должен быть от 1 до 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("Месяц начала неверен");
        }
        return true;
      }),
    body("rentalPeriod.from.year")
      .isInt({ min: 1900 })
      .withMessage("Год начала должен быть 1900 или позже")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("Год начала неверен");
        }
        return true;
      }),
    body("rentalPeriod.to.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("Месяц окончания должен быть от 1 до 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("Месяц окончания неверен");
        }
        return true;
      }),
    body("rentalPeriod.to.year")
      .isInt({ min: 1900 })
      .withMessage("Год окончания должен быть 1900 или позже")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("Год окончания неверен");
        }
        return true;
      }),
    body("landlordName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Имя арендодателя должно содержать от 2 до 100 символов")
      .custom((value) => {
        if (!validators.isValidLandlordName(value)) {
          throw new Error("Имя арендодателя содержит недопустимые символы");
        }
        return true;
      }),
    body("reviewText")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Текст отзыва должен содержать от 10 до 5000 символов")
      .custom((value) => {
        if (!validators.isValidReviewText(value)) {
          throw new Error("Текст отзыва содержит недопустимые символы");
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
          throw new Error("Рейтинг должен быть от 1 до 5");
        }
        return true;
      }),
  ],

  // Tenant review validation
  validateTenantReview: [
    body("tenantFullName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage(
        "Полное имя арендатора должно содержать от 2 до 100 символов"
      )
      .custom((value) => {
        if (!validators.isValidTenantFullName(value)) {
          throw new Error(
            "Полное имя арендатора содержит недопустимые символы"
          );
        }
        return true;
      }),
    body("tenantIdLastFour")
      .isLength({ min: 4, max: 4 })
      .withMessage("Последние 4 цифры паспорта должны быть ровно 4 символа")
      .custom((value) => {
        if (!validators.isValidIdLastFour(value)) {
          throw new Error("Последние 4 цифры паспорта должны быть числовыми");
        }
        return true;
      }),
    body("tenantPhoneLastFour")
      .isLength({ min: 4, max: 4 })
      .withMessage("Последние 4 цифры телефона должны быть ровно 4 символа")
      .custom((value) => {
        if (!validators.isValidPhoneLastFour(value)) {
          throw new Error("Последние 4 цифры телефона должны быть числовыми");
        }
        return true;
      }),
    body("rentalPeriod.from.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("Месяц начала должен быть от 1 до 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("Месяц начала неверен");
        }
        return true;
      }),
    body("rentalPeriod.from.year")
      .isInt({ min: 1900 })
      .withMessage("Год начала должен быть 1900 или позже")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("Год начала неверен");
        }
        return true;
      }),
    body("rentalPeriod.to.month")
      .isInt({ min: 1, max: 12 })
      .withMessage("Месяц окончания должен быть от 1 до 12")
      .custom((value) => {
        if (!validators.isValidMonth(value)) {
          throw new Error("Месяц окончания неверен");
        }
        return true;
      }),
    body("rentalPeriod.to.year")
      .isInt({ min: 1900 })
      .withMessage("Год окончания должен быть 1900 или позже")
      .custom((value) => {
        if (!validators.isValidYear(value)) {
          throw new Error("Год окончания неверен");
        }
        return true;
      }),
    body("reviewText")
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage("Текст отзыва должен содержать от 10 до 5000 символов")
      .custom((value) => {
        if (!validators.isValidReviewText(value)) {
          throw new Error("Текст отзыва содержит недопустимые символы");
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
          throw new Error("Рейтинг должен быть от 1 до 5");
        }
        return true;
      }),
  ],

  // Comment validation
  validateComment: [
    body("text")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Текст комментария должен содержать от 1 до 1000 символов")
      .custom((value) => {
        if (!validators.isValidCommentText(value)) {
          throw new Error("Текст комментария содержит недопустимые символы");
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
          throw new Error(
            "Номер страницы должен быть положительным целым числом"
          );
        }
        return true;
      }),
    query("limit")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidPageLimit(value)) {
          throw new Error("Лимит должен быть от 1 до 50");
        }
        return true;
      }),
    query("city")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error(
            "Поисковый запрос города содержит недопустимые символы"
          );
        }
        return true;
      }),
    query("street")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error(
            "Поисковый запрос улицы содержит недопустимые символы"
          );
        }
        return true;
      }),
    query("building")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error(
            "Поисковый запрос здания содержит недопустимые символы"
          );
        }
        return true;
      }),
    query("name")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidSearchQuery(value)) {
          throw new Error(
            "Поисковый запрос имени содержит недопустимые символы"
          );
        }
        return true;
      }),
    query("idLastFour")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidIdLastFour(value)) {
          throw new Error("Последние 4 цифры ID должны быть числовыми");
        }
        return true;
      }),
    query("phoneLastFour")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidPhoneLastFour(value)) {
          throw new Error("Последние 4 цифры телефона должны быть числовыми");
        }
        return true;
      }),
    query("rooms")
      .optional()
      .custom((value) => {
        if (value && !validators.isValidNumberOfRooms(value)) {
          throw new Error("Количество комнат должно быть от 1 до 8");
        }
        return true;
      }),
  ],

  // Admin validation
  validateModerationAction: [
    body("action").custom((value) => {
      if (!validators.isValidModerationAction(value)) {
        throw new Error("Неверное действие модерации");
      }
      return true;
    }),
  ],

  validateUserStatus: [
    body("isActive")
      .isBoolean()
      .withMessage("isActive должно быть булевым значением"),
  ],

  // ObjectId validation
  validateObjectId: [
    param("id").custom((value) => {
      if (!validators.isValidObjectId(value)) {
        throw new Error("Неверный формат ID");
      }
      return true;
    }),
  ],

  // Handle validation errors
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Ошибка валидации",
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
