# Ape Moments Photo Booth - API Contract Documentation

## Overview

This document describes the complete API contract for the Ape Moments Photo Booth application built with AWS Amplify Gen 2. The API provides endpoints for order management, file uploads, and photo processing workflows.

## Base Configuration

- **GraphQL Endpoint**: `https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql`
- **Authentication**: Identity Pool (guest access enabled)
- **Storage**: S3 bucket with organized prefixes
- **Region**: `us-east-1`

## API Endpoints

### 1. Order Management

#### Create Order

**Mutation**: `createOrderCustom`

Creates a new photo booth order with images and user details.

**Input**:

```typescript
{
  input: {
    type: "album" | "collage";   // Required: Order type
    images: string[];            // Required: Base64 encoded images or URLs
    userDetails: {               // Required: Customer information
      name: string;              // Customer name
      email: string;             // Customer email
      phone: string;             // Customer phone
      address: string;           // Customer address
      city: string;              // Customer city
      postalCode: string;        // Customer postal code
      specialInstructions?: string; // Optional: Special instructions
    };
    metadata?: {                // Optional: Order metadata
      orientation?: "portrait" | "landscape";
      pageCount?: number;
      dimensions?: {
        width: number;
        height: number;
      };
    };
  }
}
```

**Response**:

```typescript
{
  statusCode: 201;
  body: {
    orderId: string;
    type: "album" | "collage";
    status: "PENDING";
    totalPrice: number;
    currency: string;
    imageCount: number;
    userDetails: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      specialInstructions?: string;
    };
    metadata?: {
      orientation?: "portrait" | "landscape";
      pageCount?: number;
      dimensions?: {
        width: number;
        height: number;
      };
    };
    createdAt: string;
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Invalid input data
- `CREATE_ERROR` (500): Database error
- `INTERNAL_ERROR` (500): Unexpected error

---

#### Get Order Details

**Query**: `getOrderDetails`

Retrieves detailed information about a specific order.

**Input**:

```typescript
{
  orderId: string; // Required: Order ID
}
```

**Response**:

```typescript
{
  statusCode: 200;
  body: {
    orderId: string;
    type: "album" | "collage";
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    totalPrice: number;
    currency: string;
    imageCount: number;
    images: string[];            // Base64 encoded images or URLs
    userDetails: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      specialInstructions?: string;
    };
    metadata?: {
      orientation?: "portrait" | "landscape";
      pageCount?: number;
      dimensions?: {
        width: number;
        height: number;
      };
    };
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Missing orderId
- `NOT_FOUND` (404): Order not found
- `INTERNAL_ERROR` (500): Unexpected error

---

#### List Orders

**Query**: `listOrdersCustom`

Retrieves a paginated list of orders with optional filtering.

**Input**:

```typescript
{
  customerEmail?: string;                    // Filter by customer email
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";  // Filter by status
  type?: "album" | "collage";               // Filter by order type
  limit?: number;                           // Page size (default: 20)
  nextToken?: string;                       // Pagination token
}
```

**Response**:

```typescript
{
  statusCode: 200;
  body: {
    orders: Array<{
      orderId: string;
      type: "album" | "collage";
      status: string;
      totalPrice: number;
      currency: string;
      imageCount: number;
      userDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
        specialInstructions?: string;
      };
      metadata?: {
        orientation?: "portrait" | "landscape";
        pageCount?: number;
        dimensions?: {
          width: number;
          height: number;
        };
      };
      createdAt: string;
      updatedAt: string;
    }>;
    nextToken?: string;  // For pagination
    count: number;       // Number of orders returned
  }
}
```

**Error Codes**:

- `LIST_ERROR` (500): Database query error
- `INTERNAL_ERROR` (500): Unexpected error

---

#### Update Order Status

**Mutation**: `updateOrderStatus`

Updates the status of an existing order with validation for allowed transitions.

**Input**:

```typescript
{
  orderId: string;      // Required: Order ID
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";  // Required: New status
  errorMessage?: string; // Optional: Error message (required for FAILED status)
}
```

**Status Transition Rules**:

- `PENDING` → `PROCESSING`, `FAILED`
- `PROCESSING` → `COMPLETED`, `FAILED`
- `COMPLETED` → (no transitions allowed)
- `FAILED` → (no transitions allowed)

**Response**:

```typescript
{
  statusCode: 200;
  body: {
    orderId: string;
    status: string;
    errorMessage?: string;
    updatedAt: string;
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Missing required fields
- `NOT_FOUND` (404): Order not found
- `INVALID_TRANSITION` (400): Invalid status transition
- `UPDATE_ERROR` (500): Database update error
- `INTERNAL_ERROR` (500): Unexpected error

---

#### Process Order

**Mutation**: `processOrder`

Processes an order (payment, fulfillment, etc.). Only processes orders in `PROCESSING` status.

**Input**:

```typescript
{
  orderId: string; // Required: Order ID
}
```

**Response**:

```typescript
{
  statusCode: 200;
  body: {
    orderId: string;
    status: "COMPLETED";
    message: "Order processed successfully";
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Missing orderId
- `NOT_FOUND` (404): Order not found
- `INVALID_STATUS` (400): Order not in PROCESSING status
- `PROCESSING_ERROR` (500): Processing failed
- `INTERNAL_ERROR` (500): Unexpected error

---

### 2. File Upload Management

#### Presign Album Upload

**Mutation**: `presignAlbumUpload`

Generates a presigned URL for uploading album images to S3.

**Input**:

```typescript
{
  input: {
    albumId: string;        // Required: Album identifier
    fileName: string;       // Required: Original file name
    contentType: string;    // Required: MIME type
    fileSize?: number;      // Optional: File size in bytes
  }
}
```

**Allowed Content Types**:

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`
- `application/pdf`

**File Size Limit**: 10MB (configurable via `MAX_UPLOAD_MB` environment variable)

**Response**:

```typescript
{
  statusCode: 200;
  body: {
    uploadUrl: string; // Presigned URL for upload
    key: string; // S3 object key (albums/{albumId}/{timestamp}-{sanitizedFileName})
    bucket: string; // S3 bucket name
    expiresIn: 3600; // URL expiration in seconds
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Missing required fields
- `INVALID_CONTENT_TYPE` (400): Unsupported file type
- `FILE_TOO_LARGE` (400): File exceeds size limit
- `PRESIGN_ERROR` (500): Failed to generate presigned URL

---

#### Presign Collage Upload

**Mutation**: `presignCollageUpload`

Generates a presigned URL for uploading collage images to S3.

**Input**:

```typescript
{
  input: {
    collageId: string;      // Required: Collage identifier
    fileName: string;      // Required: Original file name
    contentType: string;   // Required: MIME type
    fileSize?: number;     // Optional: File size in bytes
  }
}
```

**Allowed Content Types**:

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

**File Size Limit**: 10MB (configurable via `MAX_UPLOAD_MB` environment variable)

**Response**:

```typescript
{
  statusCode: 200;
  body: {
    uploadUrl: string; // Presigned URL for upload
    key: string; // S3 object key (collages/{collageId}/{timestamp}-{sanitizedFileName})
    bucket: string; // S3 bucket name
    expiresIn: 3600; // URL expiration in seconds
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Missing required fields
- `INVALID_CONTENT_TYPE` (400): Unsupported file type
- `FILE_TOO_LARGE` (400): File exceeds size limit
- `PRESIGN_ERROR` (500): Failed to generate presigned URL

---

## Data Models

### Order Model

```typescript
{
  id: string;                    // Primary key
  type: "album" | "collage";    // Order type
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalPrice: number;            // Total order amount
  currency: string;              // Currency code (default: "USD")
  imageCount: number;             // Number of images
  images: string;                 // JSON string of base64 images or URLs
  userDetails: string;           // JSON string of user information
  metadata?: string;             // JSON string of order metadata
  errorMessage?: string;         // Error details for failed orders
  expiresAt?: number;            // Unix timestamp for TTL
  createdAt: string;             // ISO datetime
  updatedAt: string;             // ISO datetime
}
```

### Album Model

```typescript
{
  id: string;                    // Primary key
  customerId: string;            // Customer identifier
  name: string;                  // Album name
  description?: string;          // Album description
  s3Prefix: string;              // S3 prefix (albums/{uuid}/)
  imageCount: number;            // Number of images (default: 0)
  status: "UPLOADING" | "READY" | "PROCESSING" | "COMPLETED";
  pdfUrl?: string;               // Generated PDF URL
  createdAt: string;             // ISO datetime
  updatedAt: string;             // ISO datetime
}
```

### Collage Model

```typescript
{
  id: string;                    // Primary key
  customerId: string;            // Customer identifier
  name: string;                  // Collage name
  template?: string;             // Template type/layout
  s3Prefix: string;              // S3 prefix (collages/{uuid}/)
  sourceImages?: string;         // JSON array of S3 keys
  outputImageUrl?: string;       // Final collage URL
  status: "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED";
  metadata?: string;             // JSON configuration data
  createdAt: string;             // ISO datetime
  updatedAt: string;             // ISO datetime
}
```

## Storage Structure

### S3 Bucket Organization

```
ape-moments-bucket/
├── albums/
│   └── {albumId}/
│       ├── {timestamp}-{filename}.jpg
│       ├── {timestamp}-{filename}.png
│       └── {timestamp}-{filename}.pdf
├── collages/
│   └── {collageId}/
│       ├── {timestamp}-{filename}.jpg
│       └── {timestamp}-{filename}.png
└── temp/
    └── {temporary-files}  # Auto-expires after 7 days
```

### CORS Configuration

- **Allowed Origins**: `http://localhost:3000`, `https://localhost:3000`
- **Allowed Methods**: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
- **Allowed Headers**: `*`
- **Exposed Headers**: `ETag`, `Location`
- **Max Age**: 3000 seconds

## Error Handling

All API endpoints return consistent error responses:

```typescript
{
  statusCode: number;
  body: {
    message: string;           // Human-readable error message
    code: string;             // Error code for programmatic handling
    errors?: Array<{          // Validation errors (when applicable)
      field: string;
      message: string;
    }>;
    allowedTypes?: string[];   // For content type errors
    allowedTransitions?: string[]; // For status transition errors
  }
}
```

## Rate Limiting & Security

- **Authentication**: Identity Pool with guest access
- **Rate Limiting**: Handled at API Gateway level
- **File Upload**: Presigned URLs with 1-hour expiration
- **File Validation**: Content type and size validation
- **S3 Permissions**: Least privilege access scoped to specific prefixes

## Environment Variables

### Required Environment Variables

- `AMPLIFY_DATA_GRAPHQL_ENDPOINT`: GraphQL API endpoint
- `AWS_REGION`: AWS region
- `AMPLIFY_STORAGE_BUCKET_NAME`: S3 bucket name
- `MAX_UPLOAD_MB`: Maximum file size in MB (default: 10)

### AWS Credentials (Runtime)

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

## Next Steps

This API contract provides the foundation for building a photo booth application. The next section will cover frontend integration patterns and implementation examples.
