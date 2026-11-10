
const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// CREATE CATEGORY (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const existingCategory = await Category.findOne({
            name: name.trim()
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category already exists."
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description
        });

        res.status(201).json({
            message: "Category created successfully.",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error.",
            error: error.message
        });
    }
});

// GET ALL CATEGORIES (Public)
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });

        res.status(200).json({
            count: categories.length,
            categories
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error.",
            error: error.message
        });
    }
});

// GET ONE CATEGORY (Public)
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.status(200).json({ category });
    } catch (error) {
        res.status(500).json({
            message: "Server error.",
            error: error.message
        });
    }
});

// UPDATE CATEGORY (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        const { name, description } = req.body;

        if (name !== undefined && !name.trim()) {
            return res.status(400).json({
                message: "Category name cannot be empty."
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                ...(name !== undefined && { name: name.trim() }),
                ...(description !== undefined && { description })
            },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.status(200).json({
            message: "Category updated successfully.",
            category
        });
    } catch (error) {
        const status = error.code === 11000 ? 409 : 500;

        res.status(status).json({
            message: status === 409
                ? "Category name already exists."
                : "Server error.",
            error: error.message
        });
    }
});

// DELETE CATEGORY (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        const Product = require("../models/Product");

        const productsUsingCategory = await Product.exists({
            categoryId: category._id
        });

        if (productsUsingCategory) {
            return res.status(409).json({
                message: "Cannot delete category while products use it."
            });
        }

        await category.deleteOne();

        res.status(200).json({
            message: "Category deleted successfully."
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error.",
            error: error.message
        });
    }
});

module.exports = router;
