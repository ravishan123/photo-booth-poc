# Ape Moments Photo Booth Backend

A production-ready AWS Amplify Gen 2 backend for a photo booth application with order management, S3 storage for albums and collages, and GraphQL API.

## Architecture

### Resources

- **Auth**: AWS Cognito with email-based authentication (ready for future expansion)
- **Data**: AppSync GraphQL API backed by DynamoDB
- **Storage**: S3 bucket with organized prefixes and CORS configuration
- **Functions**: Node.js 20 Lambda functions for business logic

### Data Models

#### Order

- **Primary Key**: `orderId`
- **Attributes**: customerId, status, totalPrice, currency, items, errorMessage, expiresAt
- **GSIs**:
  - `customerId` → `createdAt` (descending) - Query orders by customer
  - `status` → `createdAt` - Query orders by status for dashboards
- **Status Flow**: PENDING → PROCESSING → COMPLETED/FAILED

#### Album

- **Primary Key**: `albumId`
- **Attributes**: customerId, name, description, s3Prefix, imageCount, status, pdfUrl
- **GSI**: `customerId` → `createdAt`
- **S3 Prefix**: `albums/{albumId}/`

#### Collage

- **Primary Key**: `collageId`
- **Attributes**: customerId, name, template, s3Prefix, sourceImages, outputImageUrl, status, metadata
- **GSI**: `customerId` → `createdAt`
- **S3 Prefix**: `collages/{collageId}/`

### API Operations

#### Order Management

```graphql
# Create a new order
mutation CreateOrder($input: AWSJSON!) {
  createOrder(input: $input)
}

# Get order by ID
query GetOrder($orderId: String!) {
  getOrder(orderId: $orderId)
}

# Update order status
mutation UpdateOrderStatus(
  $orderId: String!
  $status: String!
  $errorMessage: String
) {
  updateOrderStatus(
    orderId: $orderId
    status: $status
    errorMessage: $errorMessage
  )
}

# List orders (with filters)
query ListOrders(
  $customerId: String
  $status: String
  $limit: Int
  $nextToken: String
) {
  listOrders(
    customerId: $customerId
    status: $status
    limit: $limit
    nextToken: $nextToken
  )
}

# Process order (async)
mutation ProcessOrder($orderId: String!) {
  processOrder(orderId: $orderId)
}
```

#### S3 Presigned URLs

```graphql
# Generate presigned URL for album upload
mutation PresignAlbumUpload($input: AWSJSON!) {
  presignAlbumUpload(input: $input)
}

# Generate presigned URL for collage upload
mutation PresignCollageUpload($input: AWSJSON!) {
  presignCollageUpload(input: $input)
}
```

### S3 Storage Structure

```
ape-moments-{env}/
├── albums/
│   └── {uuid}/
│       ├── {timestamp}-image1.jpg
│       ├── {timestamp}-image2.png
│       └── album.pdf
├── collages/
│   └── {uuid}/
│       ├── {timestamp}-source1.jpg
│       └── {timestamp}-output.png
└── temp/
    └── {temporary files - 7 day expiration}
```

### S3 Configuration

- **CORS**: Configured for localhost:3000 and production frontend
- **Lifecycle**:
  - Noncurrent versions → Standard-IA after 30 days
  - Temp uploads expire after 7 days
- **Access**: Block all public access; presigned URLs only

### IAM Permissions (Least Privilege)

#### Order Functions

- DynamoDB: Read/Write access to Orders table and GSIs only
- No S3 access

#### Presign Functions

- S3: PutObject only on specific prefixes
  - `presignAlbumUpload`: Can only write to `albums/*`
  - `presignCollageUpload`: Can only write to `collages/*`
- No DynamoDB access

#### Process Order Function

- DynamoDB: Read/Write access to Orders table
- Can be triggered by DynamoDB streams (future enhancement)

## Setup Instructions

### Prerequisites

- Node.js 20.x or later
- AWS Account with appropriate permissions
- AWS CLI configured with profile

### Environment Variables

Create a `.env` file in the project root (optional):

```bash
APP_ENV=development
MAX_UPLOAD_MB=10
FRONTEND_ORIGIN=http://localhost:3000
```

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Install function dependencies** (optional - Amplify handles this):

```bash
cd amplify/functions/create-order && npm install && cd ../../..
cd amplify/functions/get-order && npm install && cd ../../..
cd amplify/functions/update-order-status && npm install && cd ../../..
cd amplify/functions/list-orders && npm install && cd ../../..
cd amplify/functions/presign-album-upload && npm install && cd ../../..
cd amplify/functions/presign-collage-upload && npm install && cd ../../..
cd amplify/functions/process-order && npm install && cd ../../..
```

### AWS CDK Bootstrap

Before deploying, ensure your AWS account and region are bootstrapped:

```bash
# Check if already bootstrapped
aws ssm get-parameter \
  --name /cdk-bootstrap/hnb659fds/version \
  --profile apemoments \
  --region us-west-2

# If not, bootstrap the account/region
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2 --profile apemoments
```

### Required IAM Permissions

Your IAM user needs the following permissions:

- CloudFormation: Create/Update/Delete stacks
- S3: Create/Configure buckets
- DynamoDB: Create/Configure tables
- Lambda: Create/Update functions
- IAM: Create/Attach roles and policies
- AppSync: Create/Configure GraphQL APIs
- Cognito: Create/Configure user pools
- SSM: Read CDK bootstrap parameters

Example minimal policy for sandbox development:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "dynamodb:*",
        "lambda:*",
        "iam:*",
        "appsync:*",
        "cognito-idp:*",
        "cognito-identity:*",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Local Development (Sandbox)

Start the Amplify sandbox for local development:

```bash
npx ampx sandbox --profile apemoments
```

This will:

1. Deploy backend resources to AWS
2. Watch for file changes
3. Auto-redeploy on changes
4. Generate `amplify_outputs.json` for frontend

### Deploy to Production

```bash
npx ampx pipeline deploy --branch main --profile apemoments
```

## Usage Examples

### Frontend Integration

```typescript
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "./amplify/data/resource";
import outputs from "./amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Create an order
const { data } = await client.mutations.createOrder({
  input: {
    customerId: "user123",
    items: [{ id: "1", name: "Print Package", quantity: 1, price: 29.99 }],
    currency: "USD",
  },
});

// Get presigned upload URL
const { data: presignData } = await client.mutations.presignAlbumUpload({
  input: {
    albumId: "album-uuid",
    fileName: "photo.jpg",
    contentType: "image/jpeg",
    fileSize: 1024000,
  },
});

// Upload to S3
const response = await fetch(presignData.uploadUrl, {
  method: "PUT",
  body: file,
  headers: {
    "Content-Type": "image/jpeg",
  },
});

// List orders by customer
const { data: orders } = await client.queries.listOrders({
  customerId: "user123",
  limit: 10,
});
```

### Testing API with cURL

```bash
# Get GraphQL endpoint from amplify_outputs.json
GRAPHQL_ENDPOINT="your-appsync-endpoint"
API_KEY="your-api-key"

# Create order
curl -X POST $GRAPHQL_ENDPOINT \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateOrder($input: AWSJSON!) { createOrder(input: $input) }",
    "variables": {
      "input": "{\"customerId\":\"user123\",\"items\":[{\"id\":\"1\",\"name\":\"Print\",\"quantity\":1,\"price\":29.99}]}"
    }
  }'
```

## Project Structure

```
amplify/
├── auth/
│   └── resource.ts              # Cognito auth configuration
├── data/
│   └── resource.ts              # GraphQL schema and DynamoDB models
├── storage/
│   └── resource.ts              # S3 bucket configuration
├── functions/
│   ├── create-order/            # Create order Lambda
│   ├── get-order/               # Get order Lambda
│   ├── update-order-status/     # Update order status Lambda
│   ├── list-orders/             # List orders Lambda
│   ├── presign-album-upload/    # Presign album upload Lambda
│   ├── presign-collage-upload/  # Presign collage upload Lambda
│   └── process-order/           # Async order processor Lambda
├── backend.ts                   # Main backend configuration
├── package.json
└── tsconfig.json
```

## Error Handling

All API responses follow a consistent format:

```json
{
  "statusCode": 400,
  "body": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "errors": [
      {
        "field": "customerId",
        "message": "Customer ID is required"
      }
    ]
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `INVALID_TRANSITION`: Invalid order status transition
- `INVALID_CONTENT_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File exceeds size limit
- `CREATE_ERROR`: Failed to create resource
- `UPDATE_ERROR`: Failed to update resource
- `LIST_ERROR`: Failed to list resources
- `PRESIGN_ERROR`: Failed to generate presigned URL
- `PROCESSING_ERROR`: Order processing failed
- `INTERNAL_ERROR`: Unexpected server error

## Security

- **Authentication**: Cognito with email/password (guest access enabled for public endpoints)
- **Authorization**: Guest and authenticated user access configured
- **S3**: Block all public access; presigned URLs with 1-hour expiration
- **IAM**: Least-privilege policies per function
- **CORS**: Restricted to specific origins
- **Input Validation**: All inputs validated before processing
- **Rate Limiting**: Configured at API Gateway level (adjust in AWS Console)

## Performance Optimization

- **DynamoDB GSIs**: Optimized for common query patterns
- **S3 Lifecycle**: Automatic transition to cheaper storage classes
- **Lambda Cold Starts**: Node.js 20 runtime with minimal dependencies
- **Connection Reuse**: Lambda functions reuse SDK clients

## Future Enhancements

- [ ] Add DynamoDB streams trigger for `processOrder`
- [ ] Implement payment gateway integration
- [ ] Add CloudFront CDN for S3 assets
- [ ] Implement user authentication flow
- [ ] Add API rate limiting configuration
- [ ] Add CloudWatch alarms and monitoring
- [ ] Implement collage generation Lambda
- [ ] Add unit and integration tests
- [ ] Add CI/CD pipeline configuration

## Troubleshooting

### SSM Parameter Access Denied

If you get `SSM:GetParameter` errors:

1. Check if your account is CDK bootstrapped
2. Ensure your IAM user has SSM read permissions
3. Run `npx cdk bootstrap` with appropriate profile

### Function Deployment Fails

1. Check Lambda function logs in CloudWatch
2. Verify package.json dependencies are correct
3. Ensure TypeScript compiles without errors
4. Check IAM permissions for Lambda role

### CORS Errors

1. Update CORS origins in `amplify/backend.ts`
2. Redeploy the backend
3. Check browser console for specific CORS headers

## Support

For issues or questions, please open an issue in the repository or contact the development team.

## License

ISC
