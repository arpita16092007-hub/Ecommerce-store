# ARPIARES — E-commerce Store

## 1. Project Overview

**ARPIARES** is a full-stack web-based E-commerce Store built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript. It allows customers to browse products, inspect multi-angle product galleries, manage their shopping bag, place orders, and track live delivery progress. It also provides a role-protected Admin Control Room to manage products, upload photos, organize categories, and update customer order delivery statuses.

**Live Application:** [https://onrender.com](https://onrender.com)

## 2. Problem Statement

Customers need a fast, responsive, and reliable way to discover products, inspect multiple product angles, adjust cart quantities, and track their order status from purchase to delivery. Store administrators also need a centralized dashboard to add or edit products with real photos, manage inventory stock, and update order fulfillment statuses.

## 3. User Roles

### Customer
- Register and log in securely using JWT authentication.
- Browse the product catalogue and filter by category or sort by price.
- Search products by name or description.
- View detailed product modals with interactive multi-angle image galleries.
- Add items to the shopping bag and adjust quantities 1-by-1 (− / +) or remove items.
- Place orders with a delivery address and automatic stock validation.
- View order history with a live 4-step delivery progress tracker (Pending → Confirmed → Shipped → Delivered).

### Admin
- Access the protected Admin Control Room (`admin.html`) via role-based authorization (`role: "admin"`).
- Add new products and upload single or multiple product photos directly from Mac or mobile devices.
- Edit existing product details, prices, stock levels, and images, or remove products.
- Create and manage product categories.
- View all customer orders and update order delivery statuses (Pending, Confirmed, Shipped, Delivered, Cancelled).

## 4. Implemented Features

1. **JWT User Authentication & Role-Based Access Control** (Customer & Admin roles)
2. **Product Catalogue & Category Filtering** (with price sorting and keyword search)
3. **Multi-Angle Product Detail Gallery** (interactive thumbnail switcher)
4. **Interactive Shopping Bag** (1-by-1 quantity increment/decrement and subtotal calculation)
5. **Atomic Checkout & Stock Management** (prevents overselling and deducts inventory on order placement)
6. **Customer Order History & 4-Step Delivery Tracker** (Pending, Confirmed, Shipped, Delivered)
7. **Admin Control Room** (product creation, editing, deletion, image uploads, and category management)
8. **Admin Order Fulfillment Panel** (live status dropdown and one-click `Mark Delivered` action)
9. **Responsive Cross-Device UI** (optimized for desktop, Mac, and mobile browsers)
10. **Cloud Deployment** (Node.js/Express hosted on Render with MongoDB Atlas)

## 5. Future Enhancements

1. Online Payment Gateway Integration (Razorpay / Stripe)
2. Persistent User Wishlist
3. Product Reviews and Star Ratings
4. Discount Coupons and Promo Codes
5. Email / SMS Order Status Notifications

## 6. Project Goal

The goal of this project is to deliver a complete, production-deployed full-stack shopping platform with intuitive customer ordering, live delivery tracking, and streamlined store administration.
