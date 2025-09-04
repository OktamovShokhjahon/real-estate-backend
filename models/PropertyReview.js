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
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
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

module.exports = mongoose.model("PropertyReview", propertyReviewSchema);
