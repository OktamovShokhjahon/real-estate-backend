const mongoose = require("mongoose");

const propertyReviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  building: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
  },
  apartmentNumber: {
    type: String,
  },
  numberOfRooms: {
    type: Number,
    min: 1,
    max: 8,
  },
  rentalPeriod: {
    from: {
      month: { type: Number, min: 1, max: 12 },
      year: { type: Number },
    },
    to: {
      month: { type: Number, min: 1, max: 12 },
      year: { type: Number },
    },
  },
  landlordName: {
    type: String,
  },
  reviewText: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  // Comprehensive rating system
  ratings: {
    apartment: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    residentialComplex: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    courtyard: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    parking: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    infrastructure: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      isApproved: {
        type: Boolean,
        default: false,
      },
      isReported: {
        type: Boolean,
        default: false,
      },
      reportCount: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

propertyReviewSchema.index({ city: 1, street: 1, building: 1 });

// Calculate average rating from all criteria
propertyReviewSchema.methods.calculateAverageRating = function () {
  const ratings = this.ratings;
  const validRatings = Object.values(ratings).filter(
    (rating) => rating !== null && rating !== undefined
  );

  if (validRatings.length === 0) return null;

  const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / validRatings.length) * 10) / 10; // Round to 1 decimal place
};

// Pre-save middleware to calculate average rating
propertyReviewSchema.pre("save", function (next) {
  const averageRating = this.calculateAverageRating();
  if (averageRating !== null) {
    this.rating = Math.round(averageRating); // Keep the old rating field updated for backward compatibility
  }
  next();
});

module.exports = mongoose.model("PropertyReview", propertyReviewSchema);
