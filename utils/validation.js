// Comprehensive validation utilities with regex patterns

// Cyrillic Unicode range for all blocks - updated for better Russian support
const cyrillic = "\\u0400-\\u04FF\\u0500-\\u052F\\u2DE0-\\u2DFF\\uA640-\\uA69F\\u1C80-\\u1C8F";

const validationPatterns = {
  // Email validation (RFC 5322 compliant)
  email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Password validation (8+ chars, at least 1 uppercase, 1 lowercase, 1 number)
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,

  // Name validation (letters, spaces, hyphens, apostrophes, supports full Cyrillic)
  name: new RegExp(`^[a-zA-Z${cyrillic}\\s\\-']{2,50}$`),

  // City name validation (letters, spaces, hyphens, periods, supports full Cyrillic)
  city: new RegExp(`^[a-zA-Z${cyrillic}\\s\\-\\.]{2,100}$`),

  // Street name validation (letters, numbers, spaces, common punctuation, supports full Cyrillic)
  street: new RegExp(`^[a-zA-Z${cyrillic}0-9\\s\\-\\.\\,\\']{2,200}$`),

  // Building number/name validation (alphanumeric with common symbols, supports full Cyrillic)
  building: new RegExp(`^[a-zA-Z${cyrillic}0-9\\s\\-\\.\\,\\'\\/]{1,50}$`),

  // Apartment number validation (alphanumeric with hyphens)
  apartmentNumber: /^[a-zA-Z0-9\-]{1,20}$/,

  // Floor number validation (positive integers, basement levels)
  floor: /^-?[0-9]{1,3}$/,

  // Phone number validation (international format)
  phone: /^[\+]?[1-9][\d]{0,15}$/,

  // Phone last 4 digits
  phoneLastFour: /^[0-9]{4}$/,

  // ID last 4 digits
  idLastFour: /^[0-9]{4}$/,

  // Landlord name validation (similar to name but more flexible, supports full Cyrillic)
  landlordName: new RegExp(`^[a-zA-Z${cyrillic}\\s\\-\\.']{2,100}$`),

  // Review text validation (letters, numbers, spaces, punctuation, supports full Cyrillic)
  reviewText: new RegExp(
    `^[\\w${cyrillic}\\s\\.\\,\\!\\?\\;\\:\\-\\'\\"\\$\\[\\]\\/\\&\\%\\#\\@\\+\\=\\*]{10,5000}$`
  ),

  // Rating validation (1-5)
  rating: /^[1-5]$/,

  // Year validation (1900-current year + 1)
  year: new RegExp(`^(19[0-9]{2}|20[0-9]{2}|${new Date().getFullYear() + 1})$`),

  // Month validation (1-12)
  month: /^(1[0-2]|[1-9])$/,

  // Number of rooms validation (1-8)
  numberOfRooms: /^[1-8]$/,

  // MongoDB ObjectId validation
  objectId: /^[0-9a-fA-F]{24}$/,

  // URL validation
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,

  // Username validation (alphanumeric, underscore, hyphen)
  username: /^[a-zA-Z0-9_-]{3,30}$/,

  // Postal code validation (flexible international format)
  postalCode: /^[a-zA-Z0-9\s\-]{3,10}$/,

  // IP address validation (IPv4)
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  // Hexadecimal color validation
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,

  // File extension validation
  imageExtension: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  documentExtension: /\.(pdf|doc|docx|txt|rtf)$/i,

  // Social security number (last 4 digits)
  ssnLastFour: /^[0-9]{4}$/,

  // Credit card number (basic validation)
  creditCard: /^[0-9]{13,19}$/,

  // Tenant full name (more restrictive than general name, supports full Cyrillic)
  tenantFullName: new RegExp(`^[a-zA-Z${cyrillic}\\s\\-'\.]{2,100}$`),

  // Search query validation (prevent injection, supports full Cyrillic)
  searchQuery: new RegExp(`^[a-zA-Z${cyrillic}0-9\\s\\-\\.']{1,100}$`),

  // Comment text validation (supports full Cyrillic)
  commentText: new RegExp(
    `^[\\w${cyrillic}\\s\\.\\,\\!\\?\\;\\:\\-\\'\\"\\$\\[\\]\\/\\&\\%\\#\\@\\+\\=\\*]{1,1000}$`
  ),

  // Role validation
  userRole: /^(user|admin|moderator)$/,

  // Status validation
  status: /^(active|inactive|pending|suspended)$/,

  // Action validation
  moderationAction: /^(approve|reject|delete|dismiss)$/,

  // Sort order validation
  sortOrder: /^(asc|desc)$/,

  // Pagination validation
  pageNumber: /^[1-9][0-9]*$/,
  pageLimit: /^([1-9]|[1-4][0-9]|50)$/,

  // Date format validation (YYYY-MM-DD)
  dateFormat: /^\d{4}-\d{2}-\d{2}$/,

  // Time format validation (HH:MM)
  timeFormat: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,

  // Language code validation (ISO 639-1)
  languageCode: /^[a-z]{2}$/,

  // Currency code validation (ISO 4217)
  currencyCode: /^[A-Z]{3}$/,

  // Timezone validation
  timezone: /^[A-Za-z_\/]{1,50}$/,
};

// Validation functions
const validators = {
  isValidEmail: (email) => validationPatterns.email.test(email),
  isValidPassword: (password) => validationPatterns.password.test(password),
  isValidName: (name) => validationPatterns.name.test(name),
  isValidCity: (city) => validationPatterns.city.test(city),
  isValidStreet: (street) => validationPatterns.street.test(street),
  isValidBuilding: (building) => validationPatterns.building.test(building),
  isValidApartmentNumber: (apt) => validationPatterns.apartmentNumber.test(apt),
  isValidFloor: (floor) => validationPatterns.floor.test(floor.toString()),
  isValidPhone: (phone) => validationPatterns.phone.test(phone),
  isValidPhoneLastFour: (phone) => validationPatterns.phoneLastFour.test(phone),
  isValidIdLastFour: (id) => validationPatterns.idLastFour.test(id),
  isValidLandlordName: (name) => validationPatterns.landlordName.test(name),
  isValidReviewText: (text) => validationPatterns.reviewText.test(text),
  isValidRating: (rating) => validationPatterns.rating.test(rating.toString()),
  isValidYear: (year) => validationPatterns.year.test(year.toString()),
  isValidMonth: (month) => validationPatterns.month.test(month.toString()),
  isValidNumberOfRooms: (rooms) =>
    validationPatterns.numberOfRooms.test(rooms.toString()),
  isValidObjectId: (id) => validationPatterns.objectId.test(id),
  isValidUrl: (url) => validationPatterns.url.test(url),
  isValidUsername: (username) => validationPatterns.username.test(username),
  isValidPostalCode: (code) => validationPatterns.postalCode.test(code),
  isValidIPv4: (ip) => validationPatterns.ipv4.test(ip),
  isValidHexColor: (color) => validationPatterns.hexColor.test(color),
  isValidImageExtension: (filename) =>
    validationPatterns.imageExtension.test(filename),
  isValidDocumentExtension: (filename) =>
    validationPatterns.documentExtension.test(filename),
  isValidSSNLastFour: (ssn) => validationPatterns.ssnLastFour.test(ssn),
  isValidCreditCard: (card) => validationPatterns.creditCard.test(card),
  isValidTenantFullName: (name) => validationPatterns.tenantFullName.test(name),
  isValidSearchQuery: (query) => validationPatterns.searchQuery.test(query),
  isValidCommentText: (text) => validationPatterns.commentText.test(text),
  isValidUserRole: (role) => validationPatterns.userRole.test(role),
  isValidStatus: (status) => validationPatterns.status.test(status),
  isValidModerationAction: (action) =>
    validationPatterns.moderationAction.test(action),
  isValidSortOrder: (order) => validationPatterns.sortOrder.test(order),
  isValidPageNumber: (page) =>
    validationPatterns.pageNumber.test(page.toString()),
  isValidPageLimit: (limit) =>
    validationPatterns.pageLimit.test(limit.toString()),
  isValidDateFormat: (date) => validationPatterns.dateFormat.test(date),
  isValidTimeFormat: (time) => validationPatterns.timeFormat.test(time),
  isValidLanguageCode: (code) => validationPatterns.languageCode.test(code),
  isValidCurrencyCode: (code) => validationPatterns.currencyCode.test(code),
  isValidTimezone: (tz) => validationPatterns.timezone.test(tz),
};

// Sanitization functions
const sanitizers = {
  sanitizeString: (str) => {
    if (typeof str !== "string") return "";
    return str.trim().replace(/[<>]/g, "").substring(0, 1000);
  },

  sanitizeName: (name) => {
    if (typeof name !== "string") return "";
    return name
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}\\s\\-'\\.]`, "g"), "")
      .substring(0, 50);
  },

  sanitizeEmail: (email) => {
    if (typeof email !== "string") return "";
    return email.trim().toLowerCase().substring(0, 254);
  },

  sanitizeCity: (city) => {
    if (typeof city !== "string") return "";
    return city
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}\\s\\-\\.]`, "g"), "")
      .substring(0, 100);
  },

  sanitizeStreet: (street) => {
    if (typeof street !== "string") return "";
    return street
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}0-9\\s\\-\\.\\,\\']`, "g"), "")
      .substring(0, 200);
  },

  sanitizeBuilding: (building) => {
    if (typeof building !== "string") return "";
    return building
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}0-9\\s\\-\\.\\,\\'\\/]`, "g"), "")
      .substring(0, 50);
  },

  sanitizeReviewText: (text) => {
    if (typeof text !== "string") return "";
    return text.trim().substring(0, 5000);
  },

  sanitizeSearchQuery: (query) => {
    if (typeof query !== "string") return "";
    return query
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}0-9\\s\\-\\.']`, "g"), "")
      .substring(0, 100);
  },

  sanitizeTenantFullName: (name) => {
    if (typeof name !== "string") return "";
    return name
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}\\s\\-'\\.]`, "g"), "")
      .substring(0, 100);
  },

  sanitizeLandlordName: (name) => {
    if (typeof name !== "string") return "";
    return name
      .trim()
      .replace(new RegExp(`[^a-zA-Z${cyrillic}\\s\\-\\.']`, "g"), "")
      .substring(0, 100);
  },

  sanitizeNumber: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = parseInt(num);
    if (isNaN(parsed)) return min;
    return Math.max(min, Math.min(max, parsed));
  },

  sanitizeFloat: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return min;
    return Math.max(min, Math.min(max, parsed));
  },
};

// Custom validation middleware
const createValidator = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field] || req.query[field] || req.params[field];

      if (rules.required && (!value || value === "")) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }

      if (value && rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors.push(
          `${field} must be no more than ${rules.maxLength} characters`
        );
      }

      if (value && rules.min && parseFloat(value) < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (value && rules.max && parseFloat(value) > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`);
      }

      if (value && rules.custom && !rules.custom(value)) {
        errors.push(`${field} is invalid`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

module.exports = {
  validationPatterns,
  validators,
  sanitizers,
  createValidator,
};
