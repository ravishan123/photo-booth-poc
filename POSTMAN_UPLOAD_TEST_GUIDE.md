# Postman PDF Upload Testing Guide

## 🎯 Yes, You Can Test PDF Upload in Postman!

Even though the presignUpload function isn't deployed yet, I'll show you exactly how to test it once it's ready, plus give you alternative ways to test the upload functionality.

## 🚀 Method 1: GraphQL API Test (When Deployed)

### Step 1: Get Presigned URL

**URL**: `https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql`

**Method**: `POST`

**Headers**:

```
Content-Type: application/json
x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi
```

**Body** (GraphQL):

```json
{
  "query": "mutation PresignUpload($input: AWSJSON!) { presignUpload(input: $input) }",
  "variables": {
    "input": "{\"type\":\"album\",\"uuid\":\"550e8400-e29b-41d4-a716-446655440000\",\"fileName\":\"test-album.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":2048000}"
  }
}
```

**Expected Response**:

```json
{
  "data": {
    "presignUpload": "{\"uploadUrl\":\"https://s3.amazonaws.com/...\",\"key\":\"albums/550e8400-e29b-41d4-a716-446655440000/1234567890_test-album.pdf\",\"expiresIn\":3600,\"maxFileSize\":52428800,\"allowedTypes\":[\"application/pdf\",\"image/jpeg\",\"image/png\",...]}"
  }
}
```

### Step 2: Upload PDF to S3

**URL**: `{uploadUrl from Step 1}`

**Method**: `PUT`

**Headers**:

```
Content-Type: application/pdf
```

**Body**:

- Select `binary`
- Choose your PDF file

**Expected Response**: `200 OK`

## 🧪 Method 2: Test Script (Works Now)

Since the upload function isn't deployed yet, you can test the logic with the test script:

```bash
node test-upload.js
```

This will test all scenarios including PDF uploads.

## 📋 Postman Collection Setup

### Collection: "Photo Booth API - Upload Tests"

#### Request 1: Get Presigned URL for Album PDF

- **Name**: "Get Presigned URL - Album PDF"
- **Method**: POST
- **URL**: `{{graphql_endpoint}}`
- **Headers**:
  ```
  Content-Type: application/json
  x-api-key: {{api_key}}
  ```
- **Body** (GraphQL):
  ```json
  {
    "query": "mutation PresignUpload($input: AWSJSON!) { presignUpload(input: $input) }",
    "variables": {
      "input": "{\"type\":\"album\",\"uuid\":\"{{uuid}}\",\"fileName\":\"{{filename}}\",\"contentType\":\"application/pdf\",\"fileSize\":{{file_size}}}"
    }
  }
  ```

#### Request 2: Upload PDF to S3

- **Name**: "Upload PDF to S3"
- **Method**: PUT
- **URL**: `{{presigned_url}}`
- **Headers**:
  ```
  Content-Type: application/pdf
  ```
- **Body**:
  - Type: `binary`
  - Select: PDF file

#### Request 3: Get Presigned URL for Collage PDF

- **Name**: "Get Presigned URL - Collage PDF"
- **Method**: POST
- **URL**: `{{graphql_endpoint}}`
- **Headers**:
  ```
  Content-Type: application/json
  x-api-key: {{api_key}}
  ```
- **Body** (GraphQL):
  ```json
  {
    "query": "mutation PresignUpload($input: AWSJSON!) { presignUpload(input: $input) }",
    "variables": {
      "input": "{\"type\":\"collage\",\"uuid\":\"{{uuid}}\",\"fileName\":\"{{filename}}\",\"contentType\":\"application/pdf\",\"fileSize\":{{file_size}}}"
    }
  }
  ```

## 🔧 Environment Variables

Set up these variables in Postman:

```
graphql_endpoint: https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql
api_key: da2-auuusdiikrbxnbgqcmxxhsz7xi
uuid: 550e8400-e29b-41d4-a716-446655440000
filename: test-album.pdf
file_size: 2048000
presigned_url: (will be set from previous request)
```

## 📁 Test PDF Files

Create test PDF files with these specifications:

- **Small PDF**: 1-2MB (for quick testing)
- **Medium PDF**: 5-10MB (for size testing)
- **Large PDF**: 25-45MB (for limit testing)

## 🧪 Test Scenarios

### 1. Valid PDF Upload

- **Type**: album
- **Content Type**: application/pdf
- **File Size**: 2MB
- **Expected**: Success with presigned URL

### 2. Valid Collage PDF

- **Type**: collage
- **Content Type**: application/pdf
- **File Size**: 1.5MB
- **Expected**: Success with presigned URL

### 3. Invalid Content Type

- **Type**: album
- **Content Type**: text/plain
- **Expected**: Error - invalid content type

### 4. File Too Large

- **Type**: album
- **Content Type**: application/pdf
- **File Size**: 100MB
- **Expected**: Error - file too large

### 5. Invalid Type

- **Type**: invalid
- **Expected**: Error - invalid type

## 🚀 Quick Test Steps

1. **Open Postman**
2. **Create new request**
3. **Set method to POST**
4. **Set URL**: `https://mwpghh3i6ja4zg2uxxowen6lq4.appsync-api.us-east-1.amazonaws.com/graphql`
5. **Add headers**:
   ```
   Content-Type: application/json
   x-api-key: da2-auuusdiikrbxnbgqcmxxhsz7xi
   ```
6. **Add body** (raw JSON):
   ```json
   {
     "query": "mutation PresignUpload($input: AWSJSON!) { presignUpload(input: $input) }",
     "variables": {
       "input": "{\"type\":\"album\",\"uuid\":\"test-123\",\"fileName\":\"test.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":1000000}"
     }
   }
   ```
7. **Send request**
8. **Copy the uploadUrl from response**
9. **Create new PUT request with that URL**
10. **Upload your PDF file**

## ⚠️ Current Status

The presignUpload function is created but not yet deployed. Once deployed, you can use the above steps to test PDF uploads in Postman.

## 🎉 Ready to Test!

Once the function is deployed, you'll be able to test PDF uploads directly in Postman using the steps above. The unified endpoint will handle both albums and collages with the same simple API!
