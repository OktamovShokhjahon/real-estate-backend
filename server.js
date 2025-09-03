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
const addressRoutes = require("./routes/addresses");
const recommendationRoutes = require("./routes/recommendations");

const app = express();

// Security middleware
// app.use(helmet());

// --- CORS CONFIGURATION ---
// Allow credentials and restrict origin to frontend URL(s)
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://prokvartiru.kz",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(
          new Error("CORS policy: This origin is not allowed: " + origin),
          false
        );
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
app.use("/api/addresses", addressRoutes);
app.use("/api/recommendations", recommendationRoutes);

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

// Test mobile browser compatibility endpoint
app.get("/api/test-mobile", (req, res) => {
  // Set a test cookie
  res.cookie("test-cookie", "mobile-test", {
    httpOnly: false, // Make it readable by JavaScript for testing
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 60 * 1000, // 1 minute
    path: "/",
  });

  res.json({
    message: "Mobile test endpoint",
    userAgent: req.headers["user-agent"],
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    referer: req.headers.referer,
    timestamp: new Date().toISOString(),
  });
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
