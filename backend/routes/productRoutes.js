
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// ========================================
// CREATE a product (Admin only)
// ========================================
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryId
        } = req.body;

        // Check required fields
        if (!name || !description || price === undefined) {
            return res.status(400).json({
                message: "Name, description and price are required."
            });
        }

        // Validate category ID
        if (categoryId) {
            if (!mongoose.isValidObjectId(categoryId)) {
                return res.status(400).json({
                    message: "Invalid category ID."
                });
            }

            const categoryExists = await Category.findById(categoryId);

            if (!categoryExists) {
                return res.status(404).json({
                    message: "Category not found."
                });
            }
        }

        // Create product
        const product = await Product.create({
            name,
            description,
            price,
            stock,
            imageUrl,
            categoryId
        });

        // Populate category details
        await product.populate("categoryId", "name description");

        res.status(201).json({
            message: "Product created successfully",
            product
        });

    } catch (error) {
        console.error("Product creation error:", error);

        res.status(500).json({
            message: "Could not create product.",
            error: error.message
        });
    }
});


// ========================================
// READ all products with search, category
// filtering and pagination (Public)
// ========================================
router.get("/", async (req, res) => {
    try {
        const { search, categoryId } = req.query;

        // Pagination settings
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 10;

        // Validate pagination
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                message: "Page must be positive and limit must be between 1 and 100."
            });
        }

        // Build product filter
        const filter = {};

        // Search by product name or description
        if (search) {
            const safeSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                {
                    name: {
                        $regex: safeSearch,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: safeSearch,
                        $options: "i"
                    }
                }
            ];
        }

        // Filter by category
        if (categoryId) {
            if (!mongoose.isValidObjectId(categoryId)) {
                return res.status(400).json({
                    message: "Invalid category ID."
                });
            }

            filter.categoryId = categoryId;
        }

        // Count matching products
        const totalProducts = await Product.countDocuments(filter);

        // Calculate products to skip
        const skip = (page - 1) * limit;

        // Fetch products
        const products = await Product.find(filter)
            .populate("categoryId", "name description")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total pages
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            totalProducts,
            totalPages,
            currentPage: page,
            pageSize: limit,
            products
        });

    } catch (error) {
        console.error("Product fetching error:", error);

        res.status(500).json({
            message: "Could not fetch products."
        });
    }
});


// ========================================
// READ one product (Public)
// ========================================
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        const product = await Product.findById(req.params.id)
            .populate("categoryId", "name description");

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.status(200).json(product);

    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            message: "Could not fetch product."
        });
    }
});


// ========================================
// UPDATE a product (Admin only)
// ========================================
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        // Validate category if supplied
        if (
            req.body.categoryId !== undefined &&
            req.body.categoryId !== null
        ) {
            if (!mongoose.isValidObjectId(req.body.categoryId)) {
                return res.status(400).json({
                    message: "Invalid category ID."
                });
            }

            const categoryExists = await Category.findById(
                req.body.categoryId
            );

            if (!categoryExists) {
                return res.status(404).json({
                    message: "Category not found."
                });
            }
        }

        // Update product
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        // Populate category details
        await product.populate("categoryId", "name description");

        res.status(200).json({
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error("Product update error:", error);

        res.status(500).json({
            message: "Could not update product.",
            error: error.message
        });
    }
});


// ========================================
// DELETE a product (Admin only)
// ========================================
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID."
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.status(200).json({
            message: "Product deleted successfully."
        });

    } catch (error) {
        console.error("Product deletion error:", error);

        res.status(500).json({
            message: "Could not delete product."
        });
    }
});


// Export router
module.exports = router;
