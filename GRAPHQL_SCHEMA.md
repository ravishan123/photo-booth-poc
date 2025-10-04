# GraphQL Schema Documentation

## Overview

This document provides the complete GraphQL schema for the Photo Booth POC application.

## API Endpoint

```
https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql
```

## Authentication

- **Type**: API Key
- **Header**: `x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq`
- **Authorization**: Public access

---

## Types

### Order

```graphql
type Order {
  id: ID!
  customerEmail: String!
  type: OrderType
  status: OrderStatus
  totalPrice: Float!
  currency: String
  imageCount: Int!
  images: AWSJSON!
  userDetails: AWSJSON!
  metadata: AWSJSON
  errorMessage: String
  expiresAt: Int
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}
```

### Album

```graphql
type Album {
  id: ID!
  customerId: String!
  name: String!
  description: String
  s3Prefix: String!
  imageCount: Int
  status: AlbumStatus
  pdfUrl: String
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}
```

### Collage

```graphql
type Collage {
  id: ID!
  customerId: String!
  name: String!
  template: String
  s3Prefix: String!
  sourceImages: AWSJSON
  outputImageUrl: String
  status: CollageStatus
  metadata: AWSJSON
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}
```

---

## Enums

### OrderType

```graphql
enum OrderType {
  album
  collage
}
```

### OrderStatus

```graphql
enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### AlbumStatus

```graphql
enum AlbumStatus {
  UPLOADING
  READY
  PROCESSING
  COMPLETED
}
```

### CollageStatus

```graphql
enum CollageStatus {
  DRAFT
  PROCESSING
  COMPLETED
  FAILED
}
```

### ListOrdersCustomStatus

```graphql
enum ListOrdersCustomStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### ListOrdersCustomType

```graphql
enum ListOrdersCustomType {
  album
  collage
}
```

### ModelSortDirection

```graphql
enum ModelSortDirection {
  ASC
  DESC
}
```

---

## Queries

### Standard Queries

```graphql
# Get a single order
getOrder(id: ID!): Order

# List all orders
listOrders(filter: ModelOrderFilterInput, limit: Int, nextToken: String): ModelOrderConnection

# List orders by customer email
listOrdersByCustomer(customerEmail: String!, createdAt: ModelStringKeyConditionInput, filter: ModelOrderFilterInput, limit: Int, sortDirection: ModelSortDirection): ModelOrderConnection

# List orders by type
listOrdersByType(type: OrderType!, createdAt: ModelStringKeyConditionInput, filter: ModelOrderFilterInput, limit: Int, sortDirection: ModelSortDirection): ModelOrderConnection

# List orders by status
listOrdersByStatus(status: OrderStatus!, createdAt: ModelStringKeyConditionInput, filter: ModelOrderFilterInput, limit: Int, sortDirection: ModelSortDirection): ModelOrderConnection

# Get album
getAlbum(id: ID!): Album

# List albums
listAlbums(filter: ModelAlbumFilterInput, limit: Int, nextToken: String): ModelAlbumConnection

# List albums by customer
listAlbumsByCustomer(customerId: String!, createdAt: ModelStringKeyConditionInput, filter: ModelAlbumFilterInput, limit: Int, sortDirection: ModelSortDirection): ModelAlbumConnection

# Get collage
getCollage(id: ID!): Collage

# List collages
listCollages(filter: ModelCollageFilterInput, limit: Int, nextToken: String): ModelCollageConnection

# List collages by customer
listCollagesByCustomer(customerId: String!, createdAt: ModelStringKeyConditionInput, filter: ModelCollageFilterInput, limit: Int, sortDirection: ModelSortDirection): ModelCollageConnection
```

### Custom Queries

```graphql
# Get order details (custom Lambda function)
getOrderDetails(orderId: String!): AWSJSON

# List orders with custom filtering (custom Lambda function)
listOrdersCustom(
  customerEmail: String
  status: ListOrdersCustomStatus
  type: ListOrdersCustomType
  limit: Int
  nextToken: String
): AWSJSON
```

---

## Mutations

### Standard Mutations

```graphql
# Create order
createOrder(input: CreateOrderInput!, condition: ModelOrderConditionInput): Order

# Update order
updateOrder(input: UpdateOrderInput!, condition: ModelOrderConditionInput): Order

# Delete order
deleteOrder(input: DeleteOrderInput!, condition: ModelOrderConditionInput): Order

# Create album
createAlbum(input: CreateAlbumInput!, condition: ModelAlbumConditionInput): Album

# Update album
updateAlbum(input: UpdateAlbumInput!, condition: ModelAlbumConditionInput): Album

# Delete album
deleteAlbum(input: DeleteAlbumInput!, condition: ModelAlbumConditionInput): Album

# Create collage
createCollage(input: CreateCollageInput!, condition: ModelCollageConditionInput): Collage

# Update collage
updateCollage(input: UpdateCollageInput!, condition: ModelCollageConditionInput): Collage

# Delete collage
deleteCollage(input: DeleteCollageInput!, condition: ModelCollageConditionInput): Collage
```

### Custom Mutations

```graphql
# Create order with custom validation (custom Lambda function)
createOrderCustom(input: AWSJSON!): AWSJSON

# Update order status (custom Lambda function)
updateOrderStatus(orderId: String!, status: String!, errorMessage: String): AWSJSON

# Get presigned URL for album upload (custom Lambda function)
presignAlbumUpload(input: AWSJSON!): AWSJSON

# Get presigned URL for collage upload (custom Lambda function)
presignCollageUpload(input: AWSJSON!): AWSJSON

# Process order (custom Lambda function)
processOrder(orderId: String!): AWSJSON
```

---

## Subscriptions

```graphql
# Order subscriptions
onCreateOrder(filter: ModelSubscriptionOrderFilterInput): Order
onUpdateOrder(filter: ModelSubscriptionOrderFilterInput): Order
onDeleteOrder(filter: ModelSubscriptionOrderFilterInput): Order

# Album subscriptions
onCreateAlbum(filter: ModelSubscriptionAlbumFilterInput): Album
onUpdateAlbum(filter: ModelSubscriptionAlbumFilterInput): Album
onDeleteAlbum(filter: ModelSubscriptionAlbumFilterInput): Album

# Collage subscriptions
onCreateCollage(filter: ModelSubscriptionCollageFilterInput): Collage
onUpdateCollage(filter: ModelSubscriptionCollageFilterInput): Collage
onDeleteCollage(filter: ModelSubscriptionCollageFilterInput): Collage
```

---

## Connection Types

### ModelOrderConnection

```graphql
type ModelOrderConnection {
  items: [Order!]!
  nextToken: String
}
```

### ModelAlbumConnection

```graphql
type ModelAlbumConnection {
  items: [Album!]!
  nextToken: String
}
```

### ModelCollageConnection

```graphql
type ModelCollageConnection {
  items: [Collage!]!
  nextToken: String
}
```

---

## Scalar Types

- **String**: Built-in String
- **Int**: Built-in Int
- **Float**: Built-in Float
- **Boolean**: Built-in Boolean
- **ID**: Built-in ID
- **AWSDateTime**: Extended ISO 8601 DateTime string
- **AWSJSON**: JSON string that complies with RFC 8259

---

## Example Queries

### Create Order

```graphql
mutation CreateOrderCustom($input: JSON!) {
  createOrderCustom(input: $input)
}
```

Variables:

```json
{
  "input": {
    "type": "album",
    "images": ["https://example.com/image1.jpg"],
    "userDetails": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": "123 Main Street",
      "city": "New York",
      "postalCode": "10001"
    },
    "metadata": {
      "orientation": "portrait",
      "pageCount": 20
    }
  }
}
```

### Get Order Details

```graphql
query GetOrderDetails($orderId: String!) {
  getOrderDetails(orderId: $orderId)
}
```

### List Orders

```graphql
query ListOrdersCustom(
  $customerEmail: String
  $status: ListOrdersCustomStatus
) {
  listOrdersCustom(customerEmail: $customerEmail, status: $status)
}
```

---

## Testing Commands

### Test Schema Introspection

```bash
curl --location 'https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq' \
--data '{
  "query": "query { __schema { types { name } } }"
}'
```

### Test Create Order

```bash
curl --location 'https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq' \
--data '{
  "query": "mutation CreateOrderCustom($input: JSON!) { createOrderCustom(input: $input) }",
  "variables": {
    "input": {
      "type": "album",
      "images": ["https://example.com/image1.jpg"],
      "userDetails": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "address": "123 Main Street",
        "city": "New York",
        "postalCode": "10001"
      }
    }
  }
}'
```
