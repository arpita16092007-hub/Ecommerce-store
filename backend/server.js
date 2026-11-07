
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5050;

// Middleware to read JSON data
app.use(express.json());

// Connect authentication routes
app.use("/api/auth", authRoutes);

// Connect to MongoDB first
connectDB().then(() => {

    // Health check API
    app.get("/health", (req, res) => {
        res.json({
            status: "OK",
            message: "ARPIARES backend is running",
            database: "Connected"
        });
    });

    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

});
