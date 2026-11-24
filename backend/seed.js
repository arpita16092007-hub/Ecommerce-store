require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/Category");
const Product = require("./models/Product");

const categories = [
    { name: "Electronics", description: "Audio, wearables, and smart gadgets" },
    { name: "Fashion", description: "Footwear, apparel, and everyday style" },
    { name: "Home & Living", description: "Lighting, decor, and living essentials" },
    { name: "Accessories", description: "Watches, bags, and luxury carry" },
    { name: "Beauty", description: "Skincare, fragrance, and grooming" }
];

const products = [
    { name: "Wireless Noise-Cancelling Headphones", description: "Over-ear studio headphones with 40-hour battery life and active noise cancellation.", price: 2499, stock: 25, category: "Electronics", imageUrl: "images/headphones.png" },
    { name: "Pro Wireless Earbuds", description: "Compact true-wireless earbuds with deep bass and fast USB-C charging case.", price: 1999, stock: 40, category: "Electronics", imageUrl: "images/earbuds.png" },
    { name: "AMOLED Fitness Smart Watch", description: "Always-on AMOLED display with heart-rate tracking, GPS, and 10-day battery.", price: 3499, stock: 15, category: "Electronics", imageUrl: "images/watch.png" },
    { name: "Portable Bluetooth Speaker", description: "360-degree rich acoustic sound in a water-resistant brushed metal body.", price: 2799, stock: 20, category: "Electronics", imageUrl: "images/speaker.png" },
    { name: "Ultralight Running Shoes", description: "Breathable knit mesh runners engineered for cushioned daily training.", price: 1799, stock: 30, category: "Fashion", imageUrl: "images/shoes.png" },
    { name: "Classic Polarized Sunglasses", description: "UV400 protective polarized lenses set in lightweight acetate frames.", price: 1499, stock: 35, category: "Fashion", imageUrl: "images/sunglasses.png" },
    { name: "Minimalist Leather Backpack", description: "Water-resistant vegan leather daypack with padded 16-inch laptop sleeve.", price: 3299, stock: 18, category: "Accessories", imageUrl: "images/backpack.png" },
    { name: "Chronograph Dress Watch", description: "Sapphire-coated glass with stainless steel case and genuine leather strap.", price: 4599, stock: 10, category: "Accessories", imageUrl: "images/dress-watch.png" },
    { name: "Warm Ambient Table Lamp", description: "Dimmable warm-glow bedside and desk lamp with matte brass finish.", price: 1299, stock: 14, category: "Home & Living", imageUrl: "images/lamp.png" },
    { name: "Woven Cotton Cushion Set", description: "Set of two textured handloom cushion covers in warm neutral tones.", price: 899, stock: 50, category: "Home & Living", imageUrl: "images/cushions.png" },
    { name: "Artisan Ceramic Pour-Over Set", description: "Hand-glazed ceramic coffee dripper and server for smooth morning brews.", price: 1599, stock: 22, category: "Home & Living", imageUrl: "images/coffee.png" },
    { name: "Botanical Eau de Parfum", description: "Long-lasting woody and citrus notes crafted in small batches (50ml).", price: 2199, stock: 28, category: "Beauty", imageUrl: "images/perfume.png" }
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});

    const categoryIds = {};
    for (const c of categories) {
        const doc = await Category.findOneAndUpdate(
            { name: c.name },
            c,
            { upsert: true, returnDocument: "after" }
        );
        categoryIds[c.name] = doc._id;
    }

    for (const p of products) {
        const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await Product.create({
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl,
            categoryId: categoryIds[p.category],
            retailerName: "ARPIARES Curated",
            retailerProductUrl: `https://example.com{slug}`,
            lastPriceCheckedAt: new Date(),
            currency: "INR",
            isActive: true
        });
    }

    console.log("Seed complete: 5 categories and 12 products with local screenshot paths loaded.");
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
