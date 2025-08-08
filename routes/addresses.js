const express = require("express");
const RememberedAddress = require("../models/RememberedAddress");
const { auth } = require("../middleware/auth");
const validationMiddleware = require("../middleware/validation");

const router = express.Router();

// Get remembered addresses by city
router.get(
  "/remembered",
  validationMiddleware.sanitizeInput,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { city, limit = 10 } = req.query;

      let query = {};
      if (city) {
        query.city = new RegExp(city, "i");
      }

      const addresses = await RememberedAddress.find(query)
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(parseInt(limit))
        .select("city street building residentialComplex usageCount");

      res.json({ addresses });
    } catch (error) {
      console.error("Error fetching remembered addresses:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Save a new address or update usage count
router.post(
  "/remembered",
  auth,
  validationMiddleware.sanitizeInput,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { city, street, building, residentialComplex = "" } = req.body;

      if (!city || !street || !building) {
        return res.status(400).json({
          message: "City, street, and building are required",
        });
      }

      // Try to find existing address
      const existingAddress = await RememberedAddress.findOne({
        city: city.trim(),
        street: street.trim(),
        building: building.trim(),
      });

      if (existingAddress) {
        // Update usage count and last used date
        existingAddress.usageCount += 1;
        existingAddress.lastUsed = new Date();
        if (residentialComplex && residentialComplex.trim()) {
          existingAddress.residentialComplex = residentialComplex.trim();
        }
        await existingAddress.save();
        res.json(existingAddress);
      } else {
        // Create new remembered address
        const newAddress = new RememberedAddress({
          city: city.trim(),
          street: street.trim(),
          building: building.trim(),
          residentialComplex: residentialComplex.trim(),
        });
        await newAddress.save();
        res.status(201).json(newAddress);
      }
    } catch (error) {
      console.error("Error saving remembered address:", error);
      if (error.code === 11000) {
        // Duplicate key error - address already exists
        res.status(409).json({ message: "Address already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// Get popular addresses (most used)
router.get(
  "/popular",
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;

      const popularAddresses = await RememberedAddress.find()
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(parseInt(limit))
        .select("city street building residentialComplex usageCount");

      res.json({ addresses: popularAddresses });
    } catch (error) {
      console.error("Error fetching popular addresses:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Search addresses by query
router.get(
  "/search",
  validationMiddleware.sanitizeInput,
  validationMiddleware.handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json({ addresses: [] });
      }

      const searchQuery = {
        $or: [
          { city: new RegExp(q, "i") },
          { street: new RegExp(q, "i") },
          { building: new RegExp(q, "i") },
          { residentialComplex: new RegExp(q, "i") },
        ],
      };

      const addresses = await RememberedAddress.find(searchQuery)
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(parseInt(limit))
        .select("city street building residentialComplex usageCount");

      res.json({ addresses });
    } catch (error) {
      console.error("Error searching addresses:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
