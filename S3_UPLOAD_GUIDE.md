# S3 Direct Upload Guide

## 🎯 How S3 Upload Works

### **Method 1: Direct Upload (Requires AWS Credentials)**

```javascript
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

// Configure AWS credentials (one of these methods):
// 1. AWS CLI: aws configure
// 2. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
// 3. IAM roles (if running on EC2)

const uploadToS3 = async (file, bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: "application/pdf",
  };

  return await s3.upload(params).promise();
};
```

### **Method 2: Presigned URLs (Recommended for Frontend)**

```javascript
// Step 1: Get presigned URL from your API
const response = await fetch("/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `
      mutation PresignUpload($input: AWSJSON!) {
        presignUpload(input: $input)
      }
    `,
    variables: {
      input: JSON.stringify({
        type: "album",
        uuid: "user-uuid",
        fileName: "my-file.pdf",
        contentType: "application/pdf",
        fileSize: 1000000,
      }),
    },
  }),
});

const { data } = await response.json();
const { uploadUrl, key } = JSON.parse(data.presignUpload);

// Step 2: Upload directly to S3 using presigned URL
await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: {
    "Content-Type": "application/pdf",
  },
});
```

## 🔧 Current Status

### ✅ **What Works:**

- **Order Creation** with payment methods
- **GraphQL API** for all operations
- **S3 Bucket** configured with proper permissions

### 🔄 **What's Coming:**

- **Presigned URL Generation** (function ready, needs deployment)
- **Direct File Upload** to S3

## 📋 **Upload Methods Available:**

### **1. Frontend Integration (Recommended)**

```javascript
// React/Next.js example
const uploadFile = async (file, type, uuid) => {
  try {
    // Get presigned URL
    const response = await fetch("/api/presign-upload", {
      method: "POST",
      body: JSON.stringify({
        type,
        uuid,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    const { uploadUrl } = await response.json();

    // Upload to S3
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### **2. Backend Integration**

```javascript
// Node.js/Express example
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const key = `albums/${req.body.uuid}/${Date.now()}_${file.originalname}`;

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    res.json({ success: true, location: result.Location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🚀 **Quick Test Commands**

### **Test Order Creation (Works Now):**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id type paymentMethod } }",
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
        "userDetails": "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"postalCode\":\"12345\"}"
      }
    }
  }'
```

### **Test Presigned URL (When Deployed):**

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation PresignUpload($input: AWSJSON!) { presignUpload(input: $input) }",
    "variables": {
      "input": "{\"type\":\"album\",\"uuid\":\"test-123\",\"fileName\":\"test.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":1000000}"
    }
  }'
```

## 💡 **Key Benefits:**

1. **Security**: Presigned URLs expire after 1 hour
2. **Performance**: Direct upload to S3, no server bottleneck
3. **Scalability**: S3 handles the upload, not your server
4. **Cost**: No server bandwidth costs for file uploads

## 🔐 **S3 Bucket Structure:**

```
your-bucket/
├── albums/
│   └── {uuid}/
│       └── {timestamp}_{filename}.pdf
└── collages/
    └── {uuid}/
        └── {timestamp}_{filename}.pdf
```

## 📱 **Frontend Usage:**

```javascript
// Complete upload flow
const handleFileUpload = async (file) => {
  const uuid = generateUUID();

  // 1. Create order
  const order = await createOrder({
    type: "album",
    paymentMethod: "card_payment",
    // ... other fields
  });

  // 2. Get presigned URL
  const { uploadUrl } = await getPresignedUrl({
    type: "album",
    uuid: order.id,
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  // 3. Upload file
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  // 4. Update order with file info
  await updateOrder(order.id, { status: "PROCESSING" });
};
```

The S3 upload system is ready - you just need to configure AWS credentials for direct uploads or wait for the presigned URL function to be deployed! 🚀
