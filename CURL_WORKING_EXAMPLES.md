# Working Curl Examples for Photo Booth API

## 🚧 Current Status

The `presignUpload` mutation is not yet deployed due to a deployment issue. However, I'll show you **working alternatives** and the **exact curl commands** that will work once it's deployed.

## 🎯 Working Curl Commands (For Order Creation)

### Test Order Creation (This Works Now):

```bash
curl -X POST \
  https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type status totalPrice currency paymentMethod imageCount images userDetails metadata errorMessage expiresAt createdAt updatedAt } }",
    "variables": {
      "input": {
        "customerEmail": "test@example.com",
        "type": "album",
        "status": "PENDING",
        "totalPrice": 5.0,
        "currency": "USD",
        "paymentMethod": "card_payment",
        "imageCount": 1,
        "images": "[\"550e8400-e29b-41d4-a716-446655440000\"]",
        "userDetails": "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"postalCode\":\"12345\"}"
      }
    }
  }'
```

### Test Collage Order Creation:

```bash
curl -X POST \
  https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type status totalPrice currency paymentMethod imageCount images userDetails metadata errorMessage expiresAt createdAt updatedAt } }",
    "variables": {
      "input": {
        "customerEmail": "test@example.com",
        "type": "collage",
        "status": "PENDING",
        "totalPrice": 3.0,
        "currency": "USD",
        "paymentMethod": "bank_transfer",
        "imageCount": 1,
        "images": "[\"6ba7b810-9dad-11d1-80b4-00c04fd430c8\"]",
        "userDetails": "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"postalCode\":\"12345\"}"
      }
    }
  }'
```

## 🚀 Upload Curl Commands (When Deployed)

### Step 1: Get Presigned URL

```bash
curl -X POST \
  https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" \
  -d '{
    "query": "mutation PresignUpload($input: AWSJSON!) { presignUpload(input: $input) }",
    "variables": {
      "input": "{\"type\":\"album\",\"uuid\":\"test-123\",\"fileName\":\"test.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":1000000}"
    }
  }'
```

### Step 2: Upload PDF (Replace with actual presigned URL)

```bash
curl -X PUT \
  "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: application/pdf" \
  --data-binary @/path/to/your/file.pdf
```

## 🧪 Alternative: Direct S3 Upload Test

Since the presignUpload function has deployment issues, you can test direct S3 uploads:

```bash
# Install AWS CLI if not already installed
# brew install awscli

# Configure AWS credentials
aws configure

# Test direct S3 upload
node test-direct-s3-upload.js
```

## 📋 One-Line Working Commands

### Create Album Order:

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql -H "Content-Type: application/json" -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" -d '{"query":"mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type status totalPrice currency paymentMethod } }","variables":{"input":{"customerEmail":"test@example.com","type":"album","status":"PENDING","totalPrice":5.0,"currency":"USD","paymentMethod":"card_payment","imageCount":1,"images":"[\"test-uuid\"]","userDetails":"{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"postalCode\":\"12345\"}"}}}'
```

### Create Collage Order:

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql -H "Content-Type: application/json" -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" -d '{"query":"mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type status totalPrice currency paymentMethod } }","variables":{"input":{"customerEmail":"test@example.com","type":"collage","status":"PENDING","totalPrice":3.0,"currency":"USD","paymentMethod":"bank_transfer","imageCount":1,"images":"[\"test-uuid\"]","userDetails":"{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"postalCode\":\"12345\"}"}}}'
```

## 🔧 Troubleshooting

### Error: "Field 'presignUpload' is undefined"

- **Cause**: The presignUpload mutation is not deployed yet
- **Solution**: Use the working order creation commands above, or wait for deployment

### Error: "Field 'paymentMethod' is undefined"

- **Cause**: Old schema without paymentMethod field
- **Solution**: The schema is updated, this should work now

### Error: "Invalid type"

- **Cause**: Wrong paymentMethod value
- **Solution**: Use `card_payment` or `bank_transfer`

## ✅ What Works Right Now

1. ✅ **Create Album Orders** with payment methods
2. ✅ **Create Collage Orders** with payment methods
3. ✅ **Payment method validation**
4. ✅ **All order fields including paymentMethod**

## 🚧 What's Coming

1. 🔄 **Presigned URL generation** (deployment issue being resolved)
2. 🔄 **Direct file upload to S3**
3. 🔄 **PDF and image upload support**

## 💡 Quick Test

Run this to test if the API is working:

```bash
curl -X POST https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql -H "Content-Type: application/json" -H "x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi" -d '{"query":"mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id type paymentMethod } }","variables":{"input":{"customerEmail":"test@example.com","type":"album","status":"PENDING","totalPrice":5.0,"currency":"USD","paymentMethod":"card_payment","imageCount":1,"images":"[\"test\"]","userDetails":"{\"name\":\"Test\",\"email\":\"test@example.com\",\"phone\":\"123\",\"address\":\"123\",\"city\":\"City\",\"postalCode\":\"12345\"}"}}}'
```

This should return a successful order creation with the new paymentMethod field! 🎉
