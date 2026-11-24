const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

function isValidImageSource(value) {
    if (!value) return true;
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(trimmed)) return true;
    if (/^images\/[a-zA-Z0-9._-]+$/.test(trimmed)) return true;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeGallery(images, imageUrl) {
    if (Array.isArray(images) && images.length) {
        return images.map(s => String(s).trim()).filter(Boolean);
    }
    if (typeof imageUrl === "string" && imageUrl.trim()) {
        return [imageUrl.trim()];
    }
    return [];
}

// ========================================
// CREATE PRODUCT (ADMIN ONLY)
// POST /api/products
// ========================================
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            imageUrl,
            images,
            categoryId,
            retailerName,
            retailerProductUrl,
            currency
        } = req.body;

        if (!name || !description || price === undefined || stock === undefined || !categoryId) {
            return res.status(400).json({
                message: "name, description, price, stock, and categoryId are required"
            });
        }

        if (typeof name !== "string" || !name.trim() || typeof description !== "string" || !description.trim()) {
            return res.status(400).json({ message: "name and description must be non-empty strings" });
        }

        const numericPrice = Number(price);
        const numericStock = Number(stock);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: "price must be a valid non-negative number" });
        }

        if (!Number.isInteger(numericStock) || numericStock < 0) {
            return res.status(400).json({ message: "stock must be a valid non-negative integer" });
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId" });
        }

        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ message: "Category not found" });
        }

        const gallery = normalizeGallery(images, imageUrl);
        if (gallery.some(src => !isValidImageSource(src))) {
            return res.status(400).json({
                message: "Each image must be an uploaded photo, a local images/ path, or an https:// URL"
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description: description.trim(),
            price: numericPrice,
            stock: numericStock,
            imageUrl: gallery.at(0) || "",
            images: gallery,
            categoryId,
            retailerName: typeof retailerName === "string" && retailerName.trim() ? retailerName.trim() : "ARPIARES Curated",
            retailerProductUrl: typeof retailerProductUrl === "string" ? retailerProductUrl.trim() : "",
            lastPriceCheckedAt: new Date(),
            currency: typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "INR"
        });

        return res.status(201).json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        return res.status(500).json({ message: "Error creating product" });
    }
});

// ========================================
// GET ALL ACTIVE PRODUCTS
// GET /api/products
// ========================================
router.get("/", async (req, res) => {
    try {
        const { category, search, page = 1, limit = 100 } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
        const filter = { isActive: true };

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ message: "Invalid category filter" });
            }
            filter.categoryId = category;
        }

        if (search && typeof search === "string") {
            const safeSearch = escapeRegex(search.trim().slice(0, 100));
            if (safeSearch) {
                filter.$or = [
                    { name: { $regex: safeSearch, $options: "i" } },
                    { description: { $regex: safeSearch, $options: "i" } }
                ];
            }
        }

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate("categoryId", "name description")
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        return res.status(200).json({
            message: "Products fetched successfully",
            totalProducts,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / pageSize),
            products
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching products" });
    }
});

// ========================================
// GET SINGLE PRODUCT BY ID
// GET /api/products/:id
// ========================================
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            isActive: true
        }).populate("categoryId", "name description");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching product" });
    }
});

// ========================================
// UPDATE PRODUCT (ADMIN ONLY)
// PUT /api/products/:id
// ========================================
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const allowedFields = [
            "name",
            "description",
            "price",
            "stock",
            "imageUrl",
            "images",
            "categoryId",
            "retailerName",
            "retailerProductUrl",
            "currency",
            "isActive"
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.name !== undefined) {
            if (typeof updates.name !== "string" || !updates.name.trim()) {
                return res.status(400).json({ message: "name must be a non-empty string" });
            }
            updates.name = updates.name.trim();
        }

        if (updates.description !== undefined) {
            if (typeof updates.description !== "string" || !updates.description.trim()) {
                return res.status(400).json({ message: "description must be a non-empty string" });
            }
            updates.description = updates.description.trim();
        }

        if (updates.price !== undefined) {
            const numericPrice = Number(updates.price);
            if (!Number.isFinite(numericPrice) || numericPrice < 0) {
                return res.status(400).json({ message: "price must be a valid non-negative number" });
            }
            updates.price = numericPrice;
        }

        if (updates.stock !== undefined) {
            const numericStock = Number(updates.stock);
            if (!Number.isInteger(numericStock) || numericStock < 0) {
                return res.status(400).json({ message: "stock must be a valid non-negative integer" });
            }
            updates.stock = numericStock;
        }

        if (updates.categoryId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(updates.categoryId)) {
                return res.status(400).json({ message: "Invalid categoryId" });
            }
            const categoryExists = await Category.findById(updates.categoryId);
            if (!categoryExists) {
                return res.status(404).json({ message: "Category not found" });
            }
        }

        if (updates.images !== undefined || updates.imageUrl !== undefined) {
            const gallery = normalizeGallery(updates.images, updates.imageUrl);
            if (gallery.some(src => !isValidImageSource(src))) {
                return res.status(400).json({
                    message: "Each image must be an uploaded photo, a local images/ path, or an https:// URL"
                });
            }
            updates.images = gallery;
            updates.imageUrl = gallery.at(0) || "";
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updates,
            { returnDocument: "after", runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
}
return res.status(200).json({
message: "Product updated successfully",
product: updatedProduct
});
} catch (error) {
return res.status(500).json({ message: "Error updating product" });
}
});
// ========================================
// DELETE PRODUCT (SOFT DELETE - ADMIN ONLY)
// DELETE /api/products/:id
// ========================================
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
try {
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
return res.status(400).json({ message: "Invalid product ID" });
}
const product = await Product.findByIdAndUpdate(
req.params.id,
{ isActive: false },
{ returnDocument: "after" }
);
if (!product) {
return res.status(404).json({ message: "Product not found" });
}
return res.status(200).json({
message: "Product removed successfully",
product
});
} catch (error) {
return res.status(500).json({ message: "Error deleting product" });
}
});
module.exports = router;
