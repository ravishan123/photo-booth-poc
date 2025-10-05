# Order API Testing Guide

## ✅ **Working APIs (Tested Successfully)**

### **1. List All Orders**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "query ListOrders($limit: Int) { listOrders(limit: $limit) { items { id customerEmail type status totalPrice currency paymentMethod specialNote createdAt } nextToken } }",
    "variables": { "limit": 10 }
  }'
```

### **2. Get Order by ID**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "query GetOrder($id: ID!) { getOrder(id: $id) { id customerEmail type status totalPrice currency paymentMethod imageCount specialNote createdAt updatedAt } }",
    "variables": { "id": "f0af3bd2-d701-48a4-8e9c-0ab30268b09b" }
  }'
```

### **3. List Orders by Customer Email**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "query ListOrdersByCustomer($customerEmail: String!, $limit: Int) { listOrdersByCustomer(customerEmail: $customerEmail, limit: $limit) { items { id customerEmail type status totalPrice paymentMethod specialNote createdAt } nextToken } }",
    "variables": { "customerEmail": "john.doe@example.com", "limit": 5 }
  }'
```

### **4. List Orders by Type (Album)**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "query ListOrdersByType($type: OrderType!, $limit: Int) { listOrdersByType(type: $type, limit: $limit) { items { id customerEmail type status totalPrice paymentMethod specialNote createdAt } nextToken } }",
    "variables": { "type": "album", "limit": 5 }
  }'
```

### **5. List Orders by Type (Collage)**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "query ListOrdersByType($type: OrderType!, $limit: Int) { listOrdersByType(type: $type, limit: $limit) { items { id customerEmail type status totalPrice paymentMethod specialNote createdAt } nextToken } }",
    "variables": { "type": "collage", "limit": 5 }
  }'
```

### **6. List Orders by Status (PENDING)**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "query ListOrdersByStatus($status: OrderStatus!, $limit: Int) { listOrdersByStatus(status: $status, limit: $limit) { items { id customerEmail type status totalPrice paymentMethod specialNote createdAt } nextToken } }",
    "variables": { "status": "PENDING", "limit": 5 }
  }'
```

## 📋 **Test Results Summary**

✅ **Working APIs (6/8):**

- `listOrders` - List all orders with pagination
- `getOrder` - Get specific order by ID
- `listOrdersByCustomer` - List orders by customer email
- `listOrdersByType` - List orders by type (album/collage)
- `listOrdersByStatus` - List orders by status
- Order creation with `specialNote` field

❌ **Not Working (2/8):**

- `getOrderDetails` - Custom function (Lambda not deployed)
- `listOrdersCustom` - Custom function (Lambda not deployed)

## 🎯 **Available Order IDs for Testing**

From the test results, here are some real order IDs you can use:

```
- f0af3bd2-d701-48a4-8e9c-0ab30268b09b (john.doe@example.com, album, with special note)
- eb04d96c-8fa6-445f-ad56-c89056db4970 (jane.smith@example.com, collage, with special note)
- befcf51e-399e-47f2-8dc3-5fa7b030b710 (test@example.com, album, with special note)
- cf93f1ea-0929-42ac-9113-cd4a51659962 (test@example.com, album)
- 9f7be96e-703e-4bc6-b35c-0350a4a144a1 (john.doe@example.com, album)
```

## 🚀 **Quick Test Commands**

### **Test Get Order (One-liner):**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql -H "Content-Type: application/json" -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" -d '{"query":"query GetOrder($id: ID!) { getOrder(id: $id) { id customerEmail type status totalPrice paymentMethod specialNote } }","variables":{"id":"f0af3bd2-d701-48a4-8e9c-0ab30268b09b"}}'
```

### **Test List Orders (One-liner):**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql -H "Content-Type: application/json" -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" -d '{"query":"query ListOrders { listOrders(limit: 5) { items { id customerEmail type status totalPrice paymentMethod specialNote } } }","variables":{}}'
```

### **Test List Orders by Customer (One-liner):**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql -H "Content-Type: application/json" -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" -d '{"query":"query ListOrdersByCustomer($customerEmail: String!) { listOrdersByCustomer(customerEmail: $customerEmail, limit: 3) { items { id customerEmail type status totalPrice paymentMethod specialNote } } }","variables":{"customerEmail":"john.doe@example.com"}}'
```

## 📊 **Sample Response**

### **Get Order Response:**

```json
{
  "data": {
    "getOrder": {
      "id": "f0af3bd2-d701-48a4-8e9c-0ab30268b09b",
      "customerEmail": "john.doe@example.com",
      "type": "album",
      "status": "PENDING",
      "totalPrice": 5,
      "currency": "USD",
      "paymentMethod": "card_payment",
      "specialNote": "This is for a special anniversary gift. Please make sure the colors are vibrant and high quality. Include extra pages if needed.",
      "createdAt": "2025-10-05T06:14:56.833Z",
      "updatedAt": "2025-10-05T06:14:56.833Z"
    }
  }
}
```

### **List Orders Response:**

```json
{
  "data": {
    "listOrders": {
      "items": [
        {
          "id": "f0af3bd2-d701-48a4-8e9c-0ab30268b09b",
          "customerEmail": "john.doe@example.com",
          "type": "album",
          "status": "PENDING",
          "totalPrice": 5,
          "currency": "USD",
          "paymentMethod": "card_payment",
          "specialNote": "This is for a special anniversary gift...",
          "createdAt": "2025-10-05T06:14:56.833Z"
        }
      ],
      "nextToken": "eyJ2ZXJzaW9uIjozLCJ0b2tlbiI6..."
    }
  }
}
```

## 🔧 **Frontend Integration**

### **React Hook Example:**

```javascript
const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ListOrders($limit: Int) {
              listOrders(limit: $limit) {
                items {
                  id
                  customerEmail
                  type
                  status
                  totalPrice
                  paymentMethod
                  specialNote
                  createdAt
                }
                nextToken
              }
            }
          `,
          variables: { limit: 10 },
        }),
      });

      const result = await response.json();
      setOrders(result.data.listOrders.items);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, fetchOrders };
};
```

## ✅ **Summary**

**Working Order APIs:**

- ✅ List all orders
- ✅ Get order by ID
- ✅ List orders by customer email
- ✅ List orders by type (album/collage)
- ✅ List orders by status
- ✅ Order creation with special note

**Ready for frontend integration!** 🎉
