
const express = require("express");
const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ADD PRODUCT TO CART
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Check product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        // Check quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        // Find product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Check available stock
        if (quantity > product.stock) {
            return res.status(400).json({
                message: "Not enough stock available"
            });
        }

        // Find user's cart or create a new one
        let cart = await Cart.findOne({
            userId: req.user.userId
        });

        if (!cart) {
            cart = new Cart({
                userId: req.user.userId,
                items: []
            });
        }

        // Check if product already exists
        const existingItem = cart.items.find(
            item => item.productId.toString() === productId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    message: "Not enough stock available"
                });
            }

            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                productId,
                quantity
            });
        }

        await cart.save();

        await cart.populate(
            "items.productId",
            "name price stock imageUrl"
        );

        return res.status(200).json({
            message: "Product added to cart successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error adding product to cart",
            error: error.message
        });
    }
});

module.exports = router;
