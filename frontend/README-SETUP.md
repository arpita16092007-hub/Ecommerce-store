# ARPIARES Ecommerce Frontend

This is a plain HTML, CSS and JavaScript frontend designed to use the existing Express backend in `backend/`.

## 1. Start the backend

In VS Code Terminal 1:

```bash
cd backend
npm run dev
```

Your backend should be available at `http://localhost:5050`.

## 2. Enable CORS in the backend (required for Live Server)

Your current `backend/server.js` does not show CORS middleware. Add this code immediately after `const app = express();` and before `app.use(express.json());`:

```js
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});
```

If your Live Server opens `http://localhost:5500` instead, change the allowed origin to that exact origin. Do not use `*` for an authenticated production app. Restart the backend after saving `server.js`.

## 3. Open the frontend

Open this `frontend` folder in VS Code. Install/use the free Live Server extension if you already have it, then right-click `index.html` and choose **Open with Live Server**.

The frontend files are static and need no npm install or paid service.

## 4. API configuration

The base URL is in `js/api.js`:

```js
const API_BASE = "http://localhost:5050";
```

Change it only if your backend uses a different address or port.

## 5. Existing backend routes used

- `POST /api/auth/signup` — name, email, password
- `POST /api/auth/login` — email, password; stores returned JWT in localStorage
- `GET /api/auth/profile`
- `GET /api/products?limit=100`
- `GET /api/products/:id`
- `GET /api/categories`
- `POST /api/cart/add` — productId, quantity
- `GET /api/cart`
- `POST /api/orders/checkout` — deliveryAddress
- `POST /api/products` and `DELETE /api/products/:id` — admin only
- `POST /api/categories` — admin only

## 6. Current backend limitations

The provided backend code does not currently include:
- Wishlist endpoints
- Admin endpoint to list all orders
- Admin endpoint to update an order's status
- Customer list/statistics endpoints

The wishlist icon is therefore only a notice, and the admin dashboard deliberately does not invent order/customer data. These can be implemented in the backend as a later task.

## 7. Test sequence

1. Confirm `GET http://localhost:5050/health` returns status OK.
2. Open the frontend through Live Server (not by double-clicking the HTML file).
3. Create a customer account and sign in.
4. Confirm products and categories load.
5. Add a product to the cart.
6. Open the cart and place a test order with a test address.
7. For admin testing, sign in with an account whose database role is `admin`.
