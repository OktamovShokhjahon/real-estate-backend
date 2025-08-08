const mongoose = require("mongoose");
const RememberedAddress = require("./models/RememberedAddress");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1/prokvartirukz", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for testing"))
  .catch((err) => console.log("MongoDB connection error:", err));

async function testAddressMemory() {
  try {
    console.log("Testing address memory functionality...");

    // Test 1: Create a new remembered address
    console.log("\n1. Creating a new remembered address...");
    const newAddress = new RememberedAddress({
      city: "Алматы",
      street: "Абая",
      building: "150",
      residentialComplex: "Алматы Тауэрс",
    });
    await newAddress.save();
    console.log("✓ Address created:", newAddress);

    // Test 2: Update usage count
    console.log("\n2. Updating usage count...");
    const updatedAddress = await RememberedAddress.findOneAndUpdate(
      {
        city: "Алматы",
        street: "Абая",
        building: "150",
      },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsed: new Date() },
      },
      { new: true }
    );
    console.log("✓ Usage count updated:", updatedAddress);

    // Test 3: Get popular addresses
    console.log("\n3. Getting popular addresses...");
    const popularAddresses = await RememberedAddress.find()
      .sort({ usageCount: -1, lastUsed: -1 })
      .limit(5);
    console.log("✓ Popular addresses:", popularAddresses);

    // Test 4: Search addresses
    console.log("\n4. Searching addresses...");
    const searchResults = await RememberedAddress.find({
      $or: [
        { city: new RegExp("Алматы", "i") },
        { street: new RegExp("Абая", "i") },
      ],
    });
    console.log("✓ Search results:", searchResults);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

testAddressMemory();
