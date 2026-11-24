
const express = require("express");
const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// ADD PRODUCT TO CART
// POST /api/cart/add
// ========================================

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

        // Save cart
        await cart.save();

        // Populate product details
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


// ========================================
// VIEW USER CART
// GET /api/cart
// ========================================

router.get("/", authMiddleware, async (req, res) => {
    try {

        // Find logged-in user's cart
        const cart = await Cart.findOne({
            userId: req.user.userId
        }).populate(
            "items.productId",
            "name price stock imageUrl"
        );

        // If cart does not exist
        if (!cart) {
            return res.status(200).json({
                message: "Cart fetched successfully",
                items: [],
                subtotal: 0
            });
        }

        // Calculate item totals
        const items = cart.items
            .filter(item => item.productId !== null)
            .map(item => {
                const product = item.productId;

                return {
                    productId: product._id,
                    productName: product.name,
                    imageUrl: product.imageUrl,
                    price: product.price,
                    quantity: item.quantity,
                    itemTotal: product.price * item.quantity
                };
            });

        // Calculate cart subtotal
        const subtotal = items.reduce(
            (total, item) => total + item.itemTotal,
            0
        );

        // Return cart with totals
        return res.status(200).json({
            message: "Cart fetched successfully",
            items,
            subtotal
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching cart",
            error: error.message
        });
    }
});


// ========================================
// UPDATE ITEM QUANTITY
// PUT /api/cart/item/:productId
// ========================================

router.put("/item/:productId", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: "Not enough stock available"
            });
        }

        const cart = await Cart.findOne({ userId: req.user.userId });
        const item = cart && cart.items.find(
            i => i.productId.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ message: "Item not in cart" });
        }

        item.quantity = quantity;
        await cart.save();

        return res.status(200).json({
            message: "Cart updated successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Error updating cart" });
    }
});


// ========================================
// REMOVE ITEM FROM CART
// DELETE /api/cart/item/:productId
// ========================================

router.delete("/item/:productId", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const before = cart.items.length;

        cart.items = cart.items.filter(
            i => i.productId.toString() !== productId
        );

        if (cart.items.length === before) {
            return res.status(404).json({ message: "Item not in cart" });
        }

        await cart.save();

        return res.status(200).json({
            message: "Item removed from cart"
        });

    } catch (error) {
        return res.status(500).json({ message: "Error removing item" });
    }
});


// Export router
module.exports = router;
