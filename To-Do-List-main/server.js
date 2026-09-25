const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ============================================
// SERVE FRONTEND
// ============================================

app.use(express.static(path.join(__dirname, "public")));


// ============================================
// DATABASE
// ============================================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error(
            "MongoDB connection error:",
            error.message
        );
    });


// ============================================
// ROUTES
// ============================================

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes");


// Task API
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);


// Authentication API
app.use("/api/auth", authRoutes);
app.use("/api/auth", forgotPasswordRoutes);

// ============================================
// HOME PAGE
// ============================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});


// ============================================
// API 404
// ============================================

app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});


// ============================================
// SERVER
// ============================================

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});