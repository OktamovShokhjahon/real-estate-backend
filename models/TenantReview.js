const mongoose = require("mongoose");

const tenantReviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tenantFullName: {
    type: String,
    required: true,
  },
  tenantIdLastFour: {
    type: String,
    required: true,
    length: 4,
  },
  tenantPhoneLastFour: {
    type: String,
    required: true,
    length: 4,
  },
  rentalPeriod: {
    from: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
    },
    to: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
    },
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

tenantReviewSchema.index({
  tenantFullName: 1,
  tenantIdLastFour: 1,
  tenantPhoneLastFour: 1,
});
tenantReviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("TenantReview", tenantReviewSchema);
