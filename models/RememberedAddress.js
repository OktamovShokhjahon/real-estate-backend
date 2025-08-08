const mongoose = require("mongoose");

const rememberedAddressSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true,
  },
  street: {
    type: String,
    required: true,
    trim: true,
  },
  building: {
    type: String,
    required: true,
    trim: true,
  },
  residentialComplex: {
    type: String,
    trim: true,
    default: "",
  },
  usageCount: {
    type: Number,
    default: 1,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique addresses
rememberedAddressSchema.index(
  { city: 1, street: 1, building: 1 },
  { unique: true }
);

// Index for searching by city
rememberedAddressSchema.index({ city: 1 });

// Index for sorting by usage
rememberedAddressSchema.index({ usageCount: -1, lastUsed: -1 });

module.exports = mongoose.model("RememberedAddress", rememberedAddressSchema);
