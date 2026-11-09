
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// CREATE a product (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, description, price, stock, imageUrl, categoryId } = req.body;

        if (!name || !description || price === undefined) {
            return res.status(400).json({
                message: "Name, description and price are required."
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryId
        });

        res.status(201).json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Could not create product." });
    }
});

// READ all products (Public)
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch products." });
    }
});

// READ one product (Public)
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID." });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch product." });
    }
});

// UPDATE a product (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID." });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.status(200).json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Could not update product." });
    }
});

// DELETE a product (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID." });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not delete product." });
    }
});

module.exports = router;

