# Quick Reference Card

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start sandbox (first time takes 5-10 min)
npm run sandbox

# Deploy to production
npm run deploy
```

## 📁 Project Structure

```
amplify/
├── auth/resource.ts          # Cognito configuration
├── data/resource.ts          # GraphQL schema & DynamoDB models
├── storage/resource.ts       # S3 bucket configuration
├── backend.ts                # Main backend wiring
└── functions/                # Lambda functions
    ├── create-order/
    ├── get-order/
    ├── update-order-status/
    ├── list-orders/
    ├── presign-album-upload/
    ├── presign-collage-upload/
    ├── process-order/
    └── utils/validation.ts
```

## 🔌 API Operations

### Orders

```graphql
# Create order
mutation CreateOrder {
  createOrder(
    input: {
      customerId: "user123"
      items: [{ id: "1", name: "Print", quantity: 1, price: 9.99 }]
      currency: "USD"
    }
  )
}

# Get order
query GetOrder {
  getOrder(orderId: "order-id")
}

# Update status
mutation UpdateStatus {
  updateOrderStatus(orderId: "order-id", status: "PROCESSING")
}

# List orders
query ListOrders {
  listOrders(customerId: "user123", limit: 20)
}
```

### File Uploads

```graphql
# Get presigned URL
mutation PresignUpload {
  presignAlbumUpload(
    input: {
      albumId: "album-123"
      fileName: "photo.jpg"
      contentType: "image/jpeg"
      fileSize: 1024000
    }
  )
}
```

### Models (CRUD)

```graphql
# Create album
mutation {
  createAlbum(
    input: {
      customerId: "user123"
      name: "My Album"
      s3Prefix: "albums/abc-123/"
      status: UPLOADING
    }
  )
}

# List albums
query {
  listAlbumsByCustomer(customerId: "user123", sortDirection: DESC)
}
```

## 📊 Data Models

### Order

- **ID**: Auto-generated
- **Status**: PENDING → PROCESSING → COMPLETED/FAILED
- **Indexes**: customerId, status

### Album

- **ID**: Auto-generated
- **S3 Prefix**: `albums/{id}/`
- **Indexes**: customerId

### Collage

- **ID**: Auto-generated
- **S3 Prefix**: `collages/{id}/`
- **Indexes**: customerId

## 🔐 IAM Permissions

| Function             | DynamoDB        | S3             |
| -------------------- | --------------- | -------------- |
| Order functions      | ✅ Orders table | ❌             |
| presignAlbumUpload   | ❌              | ✅ albums/\*   |
| presignCollageUpload | ❌              | ✅ collages/\* |

## 🗂️ S3 Structure

```
ape-moments-{env}/
├── albums/{uuid}/           # Photos & PDFs
├── collages/{uuid}/         # Collage assets
└── temp/                    # Auto-delete after 7 days
```

## 🛠️ Useful Commands

```bash
# Sandbox
npm run sandbox              # Start with watch mode
npm run sandbox:once         # Single deployment
npm run delete               # Delete sandbox

# Production
npm run deploy               # Deploy to production

# AWS CLI
aws sts get-caller-identity --profile apemoments
aws s3 ls s3://bucket-name/
aws dynamodb describe-table --table-name Orders
```

## 🐛 Troubleshooting

### SSM Access Denied

```bash
# Bootstrap CDK first
npx cdk bootstrap aws://ACCOUNT_ID/REGION --profile apemoments
```

### CORS Errors

1. Update `amplify/backend.ts` with your frontend URL
2. Redeploy: `npm run sandbox`

### Function Errors

```bash
# Check logs
aws logs tail /aws/lambda/function-name --follow --profile apemoments
```

## 📚 Documentation

- **README.md**: Complete setup & API reference
- **SETUP.md**: Step-by-step getting started
- **ARCHITECTURE.md**: Design & architecture
- **DEPLOYMENT_CHECKLIST.md**: Pre-deployment verification
- **PROJECT_SUMMARY.md**: What has been built
- **examples/api-usage.ts**: Frontend integration examples

## 🌐 Frontend Integration

```typescript
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource';
import outputs from './amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Use the client
const result = await client.mutations.createOrder({...});
```

## 🔗 Endpoints

After deployment, find in `amplify_outputs.json`:

- **GraphQL API**: `aws_appsync_graphqlEndpoint`
- **API Key**: `aws_appsync_apiKey`
- **Region**: `aws_appsync_region`
- **S3 Bucket**: Custom outputs

## ⚡ Performance Tips

- Use GSI queries for customer/status filtering
- Presigned URLs avoid Lambda payload limits
- DynamoDB on-demand auto-scales
- S3 lifecycle reduces costs

## 🔒 Security Checklist

- ✅ Least-privilege IAM
- ✅ Input validation
- ✅ CORS configured
- ✅ No public S3 access
- ✅ Encrypted at rest
- ✅ HTTPS only

## 📞 Support

- GitHub: [Issues](https://github.com/ravishan123/photo-booth-poc/issues)
- AWS Docs: https://docs.amplify.aws/
- Amplify Discord: https://discord.gg/amplify

---

**Version**: 1.0.0  
**Last Updated**: October 2, 2025  
**Status**: Production Ready ✅
