
const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// CHECKOUT
// POST /api/orders/checkout
// ========================================

router.post("/checkout", authMiddleware, async (req, res) => {
    let session;

    try {
        const { deliveryAddress } = req.body;

        // Validate delivery address
        if (
            typeof deliveryAddress !== "string" ||
            !deliveryAddress.trim()
        ) {
            return res.status(400).json({
                message: "Delivery address is required"
            });
        }

        // Start MongoDB session
        session = await mongoose.startSession();

        let createdOrder;

        // Execute checkout as one transaction
        await session.withTransaction(async () => {

            // Find logged-in user's cart
            const cart = await Cart.findOne({
                userId: req.user.userId
            })
                .session(session)
                .populate("items.productId", "name price stock");

            if (!cart || cart.items.length === 0) {
                const error = new Error("Your cart is empty");
                error.statusCode = 400;
                throw error;
            }

            const orderItems = [];
            let totalAmount = 0;

            // Validate products and calculate total
            for (const item of cart.items) {
                const product = item.productId;

                if (!product) {
                    const error = new Error(
                        "A product in your cart is unavailable"
                    );
                    error.statusCode = 400;
                    throw error;
                }

                if (
                    !Number.isInteger(item.quantity) ||
                    item.quantity < 1
                ) {
                    const error = new Error(
                        "Invalid product quantity"
                    );
                    error.statusCode = 400;
                    throw error;
                }

                if (product.stock < item.quantity) {
                    const error = new Error(
                        `Insufficient stock for ${product.name}`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity
                });

                totalAmount += product.price * item.quantity;
            }

            // Reduce product stock safely
            for (const item of orderItems) {
                const updatedProduct =
                    await Product.findOneAndUpdate(
                        {
                            _id: item.productId,
                            stock: { $gte: item.quantity }
                        },
                        {
                            $inc: {
                                stock: -item.quantity
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                if (!updatedProduct) {
                    const error = new Error(
                        `Insufficient stock for ${item.name}`
                    );
                    error.statusCode = 400;
                    throw error;
                }
            }

            // Create order
            const order = new Order({
                userId: req.user.userId,
                items: orderItems,
                totalAmount,
                deliveryAddress: deliveryAddress.trim(),
                orderStatus: "Pending",
                paymentStatus: "Pending"
            });

            await order.save({ session });

            // Clear customer's cart
            cart.items = [];
            await cart.save({ session });

            createdOrder = order;
        });

        return res.status(201).json({
            message: "Order placed successfully",
            order: createdOrder
        });

    } catch (error) {
        console.error("Checkout Error:", error.message);

        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Checkout failed"
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});


// ========================================
// VIEW MY ORDERS
// GET /api/orders/my-orders
// ========================================

router.get("/my-orders", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Orders fetched successfully",
            count: orders.length,
            orders
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching orders"
        });
    }
});


// Export router
module.exports = router;
