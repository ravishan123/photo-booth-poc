# Frontend Upload Guide - Photo Booth API

## 🎯 Overview

Your backend now supports **unified file uploads** for both albums and collages. You can upload PDFs and images directly to S3 using presigned URLs.

## ✨ Features

- **Unified Endpoint**: One mutation for both albums and collages
- **File Type Support**: PDFs, JPEG, PNG, WebP, GIF
- **File Size Limit**: 50MB maximum
- **Secure Uploads**: Presigned URLs with 1-hour expiry
- **Organized Storage**: Files stored in `albums/{uuid}/` or `collages/{uuid}/`

## 🔧 GraphQL API

### Mutation

```graphql
mutation PresignUpload($input: AWSJSON!) {
  presignUpload(input: $input)
}
```

### Input Structure

```json
{
  "input": {
    "type": "album" | "collage",
    "uuid": "your-unique-uuid",
    "fileName": "filename.pdf",
    "contentType": "application/pdf",
    "fileSize": 2048000
  }
}
```

### Response Structure

```json
{
  "data": {
    "presignUpload": "{
      \"uploadUrl\": \"https://s3.amazonaws.com/...\",
      \"key\": \"albums/uuid/1234567890_filename.pdf\",
      \"expiresIn\": 3600,
      \"maxFileSize\": 52428800,
      \"allowedTypes\": [\"application/pdf\", \"image/jpeg\", \"image/png\", ...]
    }"
  }
}
```

## 📱 Frontend Implementation

### 1. Get Presigned URL

```javascript
async function getPresignedUrl(type, uuid, file) {
  const response = await fetch("https://your-graphql-endpoint/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "your-api-key",
    },
    body: JSON.stringify({
      query: `
        mutation PresignUpload($input: AWSJSON!) {
          presignUpload(input: $input)
        }
      `,
      variables: {
        input: JSON.stringify({
          type: type, // "album" or "collage"
          uuid: uuid,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      },
    }),
  });

  const result = await response.json();
  const uploadData = JSON.parse(result.data.presignUpload);

  return {
    uploadUrl: uploadData.uploadUrl,
    key: uploadData.key,
  };
}
```

### 2. Upload File to S3

```javascript
async function uploadToS3(presignedUrl, file) {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response;
}
```

### 3. Complete Upload Flow

```javascript
async function uploadFile(type, uuid, file) {
  try {
    // Step 1: Get presigned URL
    const { uploadUrl, key } = await getPresignedUrl(type, uuid, file);

    // Step 2: Upload to S3
    await uploadToS3(uploadUrl, file);

    console.log("✅ File uploaded successfully!");
    console.log("S3 Key:", key);

    return { success: true, key };
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return { success: false, error: error.message };
  }
}
```

### 4. React Component Example

```jsx
import React, { useState } from "react";

function FileUpload({ type, uuid }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const result = await uploadFile(type, uuid, file);

      if (result.success) {
        alert("File uploaded successfully!");
        setUploadProgress(100);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading... {uploadProgress}%</p>}
    </div>
  );
}
```

## 📋 Supported File Types

### Albums

- **PDF**: `application/pdf`
- **Images**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`

### Collages

- **PDF**: `application/pdf`
- **Images**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`

## 🗂️ S3 Storage Structure

```
your-bucket/
├── albums/
│   └── {uuid}/
│       ├── 1234567890_my-album.pdf
│       ├── 1234567891_photo1.jpg
│       └── 1234567892_photo2.png
└── collages/
    └── {uuid}/
        ├── 1234567893_my-collage.pdf
        ├── 1234567894_collage-image.png
        └── 1234567895_another-image.jpg
```

## ⚠️ Important Notes

1. **UUID Required**: Always use the same UUID for related files
2. **File Size Limit**: Maximum 50MB per file
3. **URL Expiry**: Presigned URLs expire after 1 hour
4. **Content Type**: Must match actual file type
5. **File Names**: Special characters are sanitized in S3 keys

## 🧪 Testing

Run the upload test script:

```bash
node test-upload.js
```

This will test:

- ✅ Album PDF upload
- ✅ Album image upload
- ✅ Collage PDF upload
- ✅ Collage image upload
- ✅ Validation (invalid types, file size limits)

## 🚀 Ready to Use!

Your backend is now fully compatible with frontend file uploads. The unified endpoint makes it simple to upload both PDFs and images for albums and collages using the same API.
