// API tests. Start the backend first (npm run dev), then in another terminal:
//   npm test
// Optional: API_URL=https://your-live-backend node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");

const BASE = process.env.API_URL || "http://localhost:5050";

async function call(path, options = {}) {
    const res = await fetch(BASE + path, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
}

test("1. health check reports the backend is running", async () => {
    const { status, body } = await call("/health");
    assert.equal(status, 200);
    assert.equal(body.status, "OK");
});

test("2. products list is public and returns an array", async () => {
    const { status, body } = await call("/api/products?limit=5");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.products));
});

test("3. categories list is public", async () => {
    const { status, body } = await call("/api/categories");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.categories));
});

test("4. signup rejects an invalid email", async () => {
    const { status } = await call("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: "Test", email: "not-an-email", password: "longenough1" })
    });
    assert.equal(status, 400);
});

test("5. login rejects a wrong password", async () => {
    const { status } = await call("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "nobody@example.com", password: "wrong-password" })
    });
    assert.equal(status, 401);
});

test("6. cart requires login", async () => {
    const { status } = await call("/api/cart");
    assert.equal(status, 401);
});

test("7. creating a product requires login", async () => {
    const { status } = await call("/api/products", {
        method: "POST",
        body: JSON.stringify({ name: "x" })
    });
    assert.equal(status, 401);
});

test("8. checkout requires login", async () => {
    const { status } = await call("/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify({ deliveryAddress: "Test address" })
    });
    assert.equal(status, 401);
});
