const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();
const ALLOWED_STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const ALLOWED_PAYMENTS = ["UPI", "Card", "NetBanking", "COD"];

router.post("/checkout", authMiddleware, async (req, res) => {
    try {
        const { deliveryAddress, shippingDetails, paymentMethod = "COD", checkoutFeedback = "" } = req.body;
        let formattedAddress = typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
        if (!formattedAddress && shippingDetails && typeof shippingDetails === "object") {
            const parts = [
                shippingDetails.fullName,
                shippingDetails.phone ? "Ph: " + shippingDetails.phone : "",
                shippingDetails.addressLine,
                shippingDetails.city,
                shippingDetails.state,
                shippingDetails.pincode ? "PIN: " + shippingDetails.pincode : ""
            ].map(s => String(s || "").trim()).filter(Boolean);
            formattedAddress = parts.join(", ");
        }
        if (!formattedAddress) {
            return res.status(400).json({ message: "Complete delivery address is required" });
        }
        const chosenPayment = ALLOWED_PAYMENTS.includes(paymentMethod) ? paymentMethod : "COD";
        const initialPaymentStatus = chosenPayment === "COD" ? "Pending" : "Paid";
        const cart = await Cart.findOne({ userId: req.user.userId }).populate("items.productId", "name price stock");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty" });
        }
        const orderItems = [];
        let totalAmount = 0;
        for (const item of cart.items) {
            const product = item.productId;
            if (!product) return res.status(400).json({ message: "A product in your cart is unavailable" });
            if (!Number.isInteger(item.quantity) || item.quantity < 1) return res.status(400).json({ message: "Invalid product quantity" });
            if (product.stock < item.quantity) return res.status(400).json({ message: "Insufficient stock for " + product.name });
            orderItems.push({ productId: product._id, name: product.name, price: product.price, quantity: item.quantity });
            totalAmount += product.price * item.quantity;
        }
        const decremented = [];
        for (const item of orderItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { returnDocument: "after" }
            );
            if (!updatedProduct) {
                for (const prev of decremented) {
                    await Product.updateOne({ _id: prev.productId }, { $inc: { stock: prev.quantity } });
                }
                return res.status(400).json({ message: "Insufficient stock for " + item.name });
            }
            decremented.push(item);
        }
        const order = await Order.create({
            userId: req.user.userId,
            items: orderItems,
            totalAmount,
            deliveryAddress: formattedAddress,
            shippingDetails: shippingDetails || {},
            paymentMethod: chosenPayment,
            checkoutFeedback: String(checkoutFeedback || "").trim(),
            orderStatus: "Pending",
            paymentStatus: initialPaymentStatus
        });
        cart.items = [];
        await cart.save();
        return res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Checkout failed" });
    }
});

router.get("/my-orders", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ message: "Orders fetched successfully", count: orders.length, orders });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching orders" });
    }
});

router.put("/:id/rate", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ message: "Only customer accounts can rate delivered products" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid order ID" });
        const rating = Number(req.body.rating);
        const reviewComment = String(req.body.reviewComment || "").trim();
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "Please select a rating between 1 and 5 stars" });
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.orderStatus !== "Delivered") return res.status(400).json({ message: "You can rate an order once it is delivered" });
        order.rating = rating;
        order.reviewComment = reviewComment;
        await order.save();
        return res.status(200).json({ message: "Thank you for rating your order!", order });
    } catch (error) {
        return res.status(500).json({ message: "Error saving order rating" });
    }
});

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({}).populate("userId", "name email").sort({ createdAt: -1 });
        return res.status(200).json({ message: "All orders fetched successfully", count: orders.length, orders });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching all orders" });
    }
});

router.put("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid order ID" });
        const { orderStatus } = req.body;
        if (!ALLOWED_STATUSES.includes(orderStatus)) return res.status(400).json({ message: "Status must be one of: " + ALLOWED_STATUSES.join(", ") });
        const updates = { orderStatus };
        if (orderStatus === "Delivered") updates.paymentStatus = "Paid";
        const order = await Order.findByIdAndUpdate(req.params.id, updates, { returnDocument: "after", runValidators: true }).populate("userId", "name email");
        if (!order) return res.status(404).json({ message: "Order not found" });
        return res.status(200).json({ message: "Order marked as " + orderStatus, order });
    } catch (error) {
        return res.status(500).json({ message: "Error updating order status" });
    }
});

module.exports = router;
