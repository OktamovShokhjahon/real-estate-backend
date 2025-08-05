const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
const tenantRoutes = require("./routes/tenant");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     credentials: true,
//   })
// );

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1/prokvartirukz",
    // "mongodb+srv://leetcoder24:FTXR7Hd1x06GW880@cluster0.1iqah.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test email endpoint
const { sendEmail } = require("./utils/email");
app.get("/api/test-email", async (req, res) => {
  try {
    const to = req.query.to || process.env.EMAIL_USER;
    await sendEmail({
      to,
      subject: "Test Email from ProKvartiru.kz",
      text: "This is a test email. If you received this, your email setup works!",
      html: "<h1>Test Email</h1><p>This is a test email. If you received this, your email setup works!</p>",
    });
    res.json({ message: `Test email sent to ${to}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
// app.use((err, req, res, next) => {
//   console.log(1);
//   console.error(err.stack);
//   res.status(500).json({ message: "Something went wrong!" });
// });

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
