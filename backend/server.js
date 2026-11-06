require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5050;

// Connect to MongoDB first
connectDB().then(() => {

    app.get("/health", (req, res) => {
        res.json({
            status: "OK",
            message: "ARPIARES backend is running",
            database: "Connected"
        });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

});