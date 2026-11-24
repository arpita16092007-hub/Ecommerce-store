# ARPIARES — E-commerce Store

A full-stack web-based E-commerce Store for browsing curated products, managing a shopping bag, placing orders, and tracking live delivery statuses—complete with an Admin Control Room for catalogue and order management.

**Live Storefront:** [https://onrender.com](https://onrender.com)

---

## Tech Stack

- **Frontend:** HTML5, CSS3 (Responsive Grid & Flexbox), Vanilla JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB & Mongoose (Cloud hosted on MongoDB Atlas)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **Deployment:** Render Web Service

---

## Key Features

### Customer Experience
- **Authentication:** Secure signup and login with persistent JWT sessions.
- **Product Discovery:** Category filtering, keyword search, and price sorting (low-to-high / high-to-low).
- **Multi-Angle Gallery:** Click any product to inspect multiple product angles via interactive thumbnails.
- **Shopping Bag:** Add items, adjust quantities 1-by-1 (− / +), and view real-time INR subtotals.
- **Checkout & Live Order Tracking:** Place orders with a delivery address and track progress across 4 stages (Pending → Confirmed → Shipped → Delivered).

### Admin Control Room (`/admin.html`)
- **Product Management:** Add, edit, or delete products with live stock tracking.
- **Photo Uploader:** Upload single or multiple product images directly from Mac or mobile devices with automatic client-side compression, or link hosted image URLs.
- **Category Management:** Create and organize store categories.
- **Order Fulfillment:** View all customer orders and update delivery statuses or mark orders as **Delivered**.

---

## Project Structure

```text
Ecommerce-store/
├── backend/
│   ├── config/         # MongoDB connection setup
│   ├── middleware/     # JWT auth & admin role verification
│   ├── models/         # Mongoose schemas (User, Product, Category, Cart, Order)
│   ├── routes/         # REST API endpoints (auth, products, categories, cart, orders)
│   ├── seed.js         # Database seed script
│   └── server.js       # Express server & static frontend host
├── frontend/
│   ├── css/            # Responsive storefront & admin styles
│   ├── images/         # Product photography assets
│   ├── js/             # API client, storefront logic, and admin controller
│   ├── index.html      # Main customer storefront
│   └── admin.html      # Admin Control Room
├── FEATURES.md         # Detailed project specification & feature list
└── README.md           # Project overview & setup guide
```

---

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd Ecommerce-store/backend
   ```

2. **Install dependencies and configure environment variables:**
   ```bash
   npm install
   ```
   Create a `.env` file inside `backend/`:
   ```env
   PORT=5050
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Seed sample products and start the server:**
   ```bash
   node seed.js
   npm run dev
   ```
   Open `http://localhost:5050` in your browser.

---

## What I Built & Learned

- Designed and built an end-to-end RESTful API with Express and MongoDB, including atomic stock deduction during checkout and role-based route protection.
- Built a responsive frontend without external UI frameworks, implementing multi-angle image galleries, client-side image compression, and real-time order status tracking.
- Configured cloud database hosting on **MongoDB Atlas** and continuous deployment from GitHub to **Render**.
