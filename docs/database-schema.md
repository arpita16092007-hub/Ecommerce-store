# ARPIARES – Database Schema

## 1. Introduction

A database is used to store and manage information in an organised way.

Our ARPIARES E-commerce Store will use **MongoDB**. MongoDB stores data in collections, and each collection contains documents.

We will use six main collections:

1. Users
2. Categories
3. Products
4. CartItems
5. Orders
6. OrderItems

---

## 2. Users Collection

**Purpose:** Stores information about customers and administrators.

**Fields:**

| Field Name | Data Type | Description |
|---|---|---|
| userId | ObjectId | Unique ID of the user |
| name | String | Full name of the user |
| email | String | Email address |
| passwordHash | String | Hashed password |
| role | String | Customer or Admin |
| createdAt | Date | Account creation date |

**Example:**
```json
{
  "name": "Arpita",
  "email": "arpita@example.com",
  "passwordHash": "hashed_password",
  "role": "customer",
  "createdAt": "2026-11-04"
}
```

Note: Passwords must always be stored as secure hashes, never as plain text.

---

## 3. Categories Collection

**Purpose:** Stores different categories of products available in the store.

**Fields:**

| Field Name | Data Type | Description |
|---|---|---|
| categoryId | ObjectId | Unique category ID |
| name | String | Category name |
| description | String | Category description |

**Example:**
```json
{
  "name": "Electronics",
  "description": "Electronic products and accessories"
}
```

---

## 4. Products Collection

**Purpose:** Stores information about products available for customers to purchase.

**Fields:**

| Field Name | Data Type | Description |
|---|---|---|
| productId | ObjectId | Unique product ID |
| name | String | Product name |
| description | String | Product details |
| price | Number | Product price |
| stock | Number | Available quantity |
| imageUrl | String | Product image location |
| categoryId | ObjectId | Reference to Categories |
| createdAt | Date | Product creation date |

**Example:**
```json
{
  "name": "Wireless Headphones",
  "description": "Premium wireless headphones",
  "price": 2499,
  "stock": 20,
  "imageUrl": "headphones.jpg",
  "categoryId": "CATEGORY_OBJECT_ID",
  "createdAt": "2026-11-04"
}
```

---

## 5. CartItems Collection

**Purpose:** Stores products that customers add to their shopping carts.

**Fields:**

| Field Name | Data Type | Description |
|---|---|---|
| cartItemId | ObjectId | Unique cart item ID |
| userId | ObjectId | Reference to Users |
| productId | ObjectId | Reference to Products |
| quantity | Number | Number of products added |

**Example:**
```json
{
  "userId": "USER_OBJECT_ID",
  "productId": "PRODUCT_OBJECT_ID",
  "quantity": 2
}
```

---

## 6. Orders Collection

**Purpose:** Stores order information when customers place orders.

**Fields:**

| Field Name | Data Type | Description |
|---|---|---|
| orderId | ObjectId | Unique order ID |
| userId | ObjectId | Reference to Users |
| orderDate | Date | Date of the order |
| totalAmount | Number | Total order amount |
| status | String | Order status |

**Example:**
```json
{
  "userId": "USER_OBJECT_ID",
  "orderDate": "2026-11-04",
  "totalAmount": 4998,
  "status": "Pending"
}
```

---

## 7. OrderItems Collection

**Purpose:** Stores individual products included in each order.

**Fields:**

| Field Name | Data Type | Description |
|---|---|---|
| orderItemId | ObjectId | Unique order item ID |
| orderId | ObjectId | Reference to Orders |
| productId | ObjectId | Reference to Products |
| quantity | Number | Purchased quantity |
| priceAtPurchase | Number | Product price when purchased |

**Example:**
```json
{
  "orderId": "ORDER_OBJECT_ID",
  "productId": "PRODUCT_OBJECT_ID",
  "quantity": 2,
  "priceAtPurchase": 2499
}
```

Note: `priceAtPurchase` helps preserve the original product price even if the current product price changes later.

---

## 8. Database Relationships

The six collections are connected through these relationships:

1. One Category can have many Products.
2. One User can have many CartItems.
3. One Product can appear in many CartItems.
4. One User can place many Orders.
5. One Order can contain many OrderItems.
6. One Product can appear in many OrderItems.

### Relationship Summary

| Collection 1 | Relationship | Collection 2 |
|---|---|---|
| Categories | One-to-Many | Products |
| Users | One-to-Many | CartItems |
| Products | One-to-Many | CartItems |
| Users | One-to-Many | Orders |
| Orders | One-to-Many | OrderItems |
| Products | One-to-Many | OrderItems |

---

## 9. Conclusion

The ARPIARES E-commerce Store database schema organises customer information, product details, shopping carts and orders into six collections.

These collections help manage the store's data efficiently and provide a foundation for developing the application's backend.
