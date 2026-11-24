require("dotenv").config();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env file");
    process.exit(1);
}

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

// Allow localhost, Live Server, local network IPs (Mac/Android), and deployed CLIENT_URL
const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];

if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Allow listed origins or any local network IP (e.g., 192.168.x.x:5500)
        const isLocalNetwork = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
        if (allowedOrigins.includes(origin) || isLocalNetwork) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    }
}));

app.use(express.json({ limit: "15mb" }));


// Connect routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

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

    // Listen on 0.0.0.0 so Mac and Android devices on the same Wi-Fi can reach it
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
