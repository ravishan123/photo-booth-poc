# Frontend Special Note Field Integration

## ✅ **New Field Added: `specialNote`**

The `specialNote` field has been successfully added to the Order model as an **optional frontend text area field**.

## 📋 **Field Details:**

- **Type**: `String` (optional)
- **Purpose**: Frontend text area for customer special instructions
- **Usage**: Customer can add special notes, instructions, or requirements
- **Storage**: Stored in DynamoDB as part of the Order record

## 🎯 **Working Curl Commands:**

### **Test Order Creation with Special Note:**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type paymentMethod specialNote totalPrice } }",
    "variables": {
      "input": {
        "customerEmail": "test@example.com",
        "type": "album",
        "status": "PENDING",
        "totalPrice": 5.0,
        "currency": "USD",
        "paymentMethod": "card_payment",
        "imageCount": 1,
        "images": "[\"test-uuid\"]",
        "userDetails": "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"postalCode\":\"12345\"}",
        "specialNote": "This is a test special note from the frontend text area. Please handle with extra care!"
      }
    }
  }'
```

### **Test Album Order with Special Note:**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type paymentMethod specialNote totalPrice } }",
    "variables": {
      "input": {
        "customerEmail": "customer@example.com",
        "type": "album",
        "status": "PENDING",
        "totalPrice": 5.0,
        "currency": "USD",
        "paymentMethod": "card_payment",
        "imageCount": 1,
        "images": "[\"album-uuid\"]",
        "userDetails": "{\"name\":\"John Doe\",\"email\":\"customer@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Main St\",\"city\":\"New York\",\"postalCode\":\"10001\"}",
        "specialNote": "This is for a special anniversary gift. Please make sure the colors are vibrant and high quality. Include extra pages if needed."
      }
    }
  }'
```

### **Test Collage Order with Special Note:**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type paymentMethod specialNote totalPrice } }",
    "variables": {
      "input": {
        "customerEmail": "customer@example.com",
        "type": "collage",
        "status": "PENDING",
        "totalPrice": 3.0,
        "currency": "USD",
        "paymentMethod": "bank_transfer",
        "imageCount": 1,
        "images": "[\"collage-uuid\"]",
        "userDetails": "{\"name\":\"Jane Smith\",\"email\":\"customer@example.com\",\"phone\":\"+1987654321\",\"address\":\"456 Oak Ave\",\"city\":\"Los Angeles\",\"postalCode\":\"90210\"}",
        "specialNote": "Please use landscape orientation and ensure all photos are clearly visible."
      }
    }
  }'
```

## 📱 **Frontend Integration Examples:**

### **React Component Example:**

```jsx
import React, { useState } from "react";

const OrderForm = () => {
  const [formData, setFormData] = useState({
    customerEmail: "",
    type: "album",
    paymentMethod: "card_payment",
    totalPrice: 5.0,
    imageCount: 1,
    images: [""],
    userDetails: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
    },
    specialNote: "", // New field
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const orderInput = {
      ...formData,
      images: JSON.stringify(formData.images),
      userDetails: JSON.stringify(formData.userDetails),
      status: "PENDING",
      currency: "USD",
    };

    try {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation CreateOrder($input: CreateOrderInput!) {
              createOrder(input: $input) {
                id
                customerEmail
                type
                paymentMethod
                specialNote
                totalPrice
              }
            }
          `,
          variables: { input: orderInput },
        }),
      });

      const result = await response.json();
      console.log("Order created:", result.data.createOrder);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}

      <div>
        <label htmlFor="specialNote">Special Instructions (Optional):</label>
        <textarea
          id="specialNote"
          value={formData.specialNote}
          onChange={(e) =>
            setFormData({
              ...formData,
              specialNote: e.target.value,
            })
          }
          rows={4}
          cols={50}
          placeholder="Any special instructions, requirements, or notes for your order..."
        />
      </div>

      <button type="submit">Create Order</button>
    </form>
  );
};

export default OrderForm;
```

### **Next.js API Route Example:**

```javascript
// pages/api/create-order.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    customerEmail,
    type,
    paymentMethod,
    totalPrice,
    imageCount,
    images,
    userDetails,
    specialNote,
  } = req.body;

  const orderInput = {
    customerEmail,
    type,
    status: "PENDING",
    totalPrice,
    currency: "USD",
    paymentMethod,
    imageCount,
    images: JSON.stringify(images),
    userDetails: JSON.stringify(userDetails),
    specialNote: specialNote || null, // Optional field
  };

  try {
    const response = await fetch(process.env.GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.GRAPHQL_API_KEY,
      },
      body: JSON.stringify({
        query: `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              id
              customerEmail
              type
              paymentMethod
              specialNote
              totalPrice
            }
          }
        `,
        variables: { input: orderInput },
      }),
    });

    const result = await response.json();
    res.status(200).json(result.data.createOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 🎯 **GraphQL Schema:**

```graphql
type Order {
  id: ID!
  customerEmail: String!
  type: OrderType
  status: OrderStatus
  totalPrice: Float!
  currency: String!
  paymentMethod: PaymentMethod
  imageCount: Int!
  images: AWSJSON!
  userDetails: AWSJSON!
  specialNote: String # New optional field
  metadata: AWSJSON
  errorMessage: String
  expiresAt: Int
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}

input CreateOrderInput {
  customerEmail: String!
  type: OrderType
  status: OrderStatus
  totalPrice: Float!
  currency: String
  paymentMethod: PaymentMethod
  imageCount: Int!
  images: AWSJSON!
  userDetails: AWSJSON!
  specialNote: String # New optional field
  metadata: AWSJSON
  errorMessage: String
  expiresAt: Int
}
```

## ✅ **Test Results:**

The `specialNote` field is now fully functional:

- ✅ **Schema Updated**: Field added to Order model
- ✅ **API Working**: Create order with special note
- ✅ **Optional Field**: Can be null/empty
- ✅ **Frontend Ready**: Text area integration examples provided
- ✅ **Testing Complete**: Both album and collage orders tested

## 💡 **Usage Examples:**

### **Customer Special Instructions:**

- "Please use landscape orientation"
- "This is for a special anniversary gift"
- "Make sure colors are vibrant and high quality"
- "Include extra pages if needed"
- "Handle with extra care during shipping"

### **Business Requirements:**

- "Rush order - needed by Friday"
- "Use premium paper quality"
- "Add watermark on each page"
- "Double-check spelling before printing"

The `specialNote` field is now ready for frontend integration! 🎉
