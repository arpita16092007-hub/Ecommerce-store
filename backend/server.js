require("dotenv").config();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env file");
    process.exit(1);
}

const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Serve the frontend folder directly so the whole store runs on one URL
app.use(express.static(path.join(__dirname, "../frontend")));

// Connect routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

connectDB().then(() => {
    app.get("/health", (req, res) => {
        res.json({
            status: "OK",
            message: "ARPIARES backend is running",
            database: "Connected"
        });
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
