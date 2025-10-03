# Ape Moments Backend Architecture

## Overview

This document describes the architecture of the Ape Moments Photo Booth backend built with AWS Amplify Gen 2.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Application                      │
│                    (React/Next.js/Mobile)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Amplify Gen 2                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Cognito    │    │   AppSync    │    │      S3      │      │
│  │  Auth/IdP    │───▶│   GraphQL    │    │   Storage    │      │
│  └──────────────┘    └───────┬──────┘    └──────────────┘      │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Lambda Functions (Node.js 20)          │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │ • createOrder         • presignAlbumUpload          │        │
│  │ • getOrder            • presignCollageUpload        │        │
│  │ • updateOrderStatus   • processOrder                │        │
│  │ • listOrders                                        │        │
│  └──────────┬──────────────────────────┬───────────────┘        │
│             │                          │                        │
│             ▼                          ▼                        │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │    DynamoDB      │      │       S3         │                │
│  │   • Orders       │      │ • albums/        │                │
│  │   • Albums       │      │ • collages/      │                │
│  │   • Collages     │      │ • temp/          │                │
│  └──────────────────┘      └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Authentication (Cognito)

**Purpose**: User authentication and identity management

**Configuration**:

- Email-based authentication
- Identity Pool for guest and authenticated access
- Ready for future expansion (social logins, MFA)

**Current State**: Configured but guest access enabled for all endpoints

### 2. API Layer (AppSync GraphQL)

**Purpose**: Unified API gateway for all backend operations

**Features**:

- Type-safe GraphQL schema
- Automatic CRUD operations for models
- Custom queries/mutations for business logic
- Built-in authorization rules

**Endpoints**:

- Models: Order, Album, Collage (CRUD operations)
- Custom queries: getOrder, listOrders
- Custom mutations: createOrder, updateOrderStatus, presignAlbumUpload, presignCollageUpload, processOrder

### 3. Data Layer (DynamoDB)

**Tables**:

#### Orders Table

```
PK: orderId (String)
Attributes:
  - customerId: String
  - status: PENDING | PROCESSING | COMPLETED | FAILED
  - totalPrice: Number
  - currency: String
  - items: JSON
  - errorMessage: String (optional)
  - expiresAt: Number (TTL)
  - createdAt: DateTime
  - updatedAt: DateTime

GSI1: customerId-createdAt-index
  - Partition Key: customerId
  - Sort Key: createdAt (descending)
  - Use case: List orders by customer

GSI2: status-createdAt-index
  - Partition Key: status
  - Sort Key: createdAt (descending)
  - Use case: Operational dashboards
```

#### Albums Table

```
PK: albumId (String)
Attributes:
  - customerId: String
  - name: String
  - description: String
  - s3Prefix: String (albums/{uuid}/)
  - imageCount: Number
  - status: UPLOADING | READY | PROCESSING | COMPLETED
  - pdfUrl: String
  - createdAt: DateTime
  - updatedAt: DateTime

GSI1: customerId-createdAt-index
  - Use case: List albums by customer
```

#### Collages Table

```
PK: collageId (String)
Attributes:
  - customerId: String
  - name: String
  - template: String
  - s3Prefix: String (collages/{uuid}/)
  - sourceImages: JSON
  - outputImageUrl: String
  - status: DRAFT | PROCESSING | COMPLETED | FAILED
  - metadata: JSON
  - createdAt: DateTime
  - updatedAt: DateTime

GSI1: customerId-createdAt-index
  - Use case: List collages by customer
```

### 4. Storage Layer (S3)

**Bucket Structure**:

```
ape-moments-{env}/
├── albums/
│   └── {albumId}/
│       ├── {timestamp}-{filename}.jpg
│       └── album.pdf
├── collages/
│   └── {collageId}/
│       ├── {timestamp}-source.jpg
│       └── {timestamp}-output.png
└── temp/
    └── {temporary uploads}
```

**Configuration**:

- **CORS**: Enabled for localhost:3000 and production frontend
- **Lifecycle**:
  - Noncurrent versions → Standard-IA after 30 days
  - Temp uploads expire after 7 days
- **Access**: Block all public access
- **Versioning**: Enabled

### 5. Function Layer (Lambda)

#### Order Management Functions

**createOrder**

- **Purpose**: Validate and create new orders
- **Input**: customerId, items[], currency
- **Output**: orderId, status, totalPrice
- **Permissions**: DynamoDB write (Orders table only)

**getOrder**

- **Purpose**: Fetch order details by ID
- **Input**: orderId
- **Output**: Complete order object
- **Permissions**: DynamoDB read (Orders table only)

**updateOrderStatus**

- **Purpose**: Update order status with validation
- **Input**: orderId, status, errorMessage?
- **Validation**: Enforces allowed status transitions
- **Permissions**: DynamoDB read/write (Orders table only)

**listOrders**

- **Purpose**: Query orders by customer or status
- **Input**: customerId?, status?, limit, nextToken
- **Uses**: GSI queries for efficient pagination
- **Permissions**: DynamoDB query (Orders table + GSIs)

**processOrder**

- **Purpose**: Async order processing (payment, fulfillment)
- **Input**: orderId
- **Current**: Placeholder logic (updates status)
- **Future**: Payment gateway integration, fulfillment
- **Permissions**: DynamoDB read/write (Orders table only)

#### Storage Functions

**presignAlbumUpload**

- **Purpose**: Generate presigned URLs for album uploads
- **Input**: albumId, fileName, contentType, fileSize?
- **Validation**: Content type, file size limits
- **Output**: presignedUrl, s3Key, expiresIn
- **Permissions**: S3 PutObject on `albums/*` only

**presignCollageUpload**

- **Purpose**: Generate presigned URLs for collage uploads
- **Input**: collageId, fileName, contentType, fileSize?
- **Validation**: Content type, file size limits
- **Output**: presignedUrl, s3Key, expiresIn
- **Permissions**: S3 PutObject on `collages/*` only

## Security Architecture

### IAM Policies (Least Privilege)

```
Order Functions:
├── DynamoDB
│   ├── PutItem (Orders table)
│   ├── GetItem (Orders table)
│   ├── UpdateItem (Orders table)
│   └── Query (Orders GSIs)
└── No S3 access

Presign Functions:
├── S3
│   └── PutObject (specific prefix only)
│       ├── presignAlbumUpload → albums/* only
│       └── presignCollageUpload → collages/* only
└── No DynamoDB access
```

### Authorization Flow

```
1. Request → Cognito (or guest identity)
2. Identity → AppSync with token
3. AppSync validates against schema authorization rules
4. Lambda executes with least-privilege IAM role
5. Response → Frontend
```

## Data Flow Examples

### Order Creation Flow

```
1. Frontend: client.mutations.createOrder(input)
2. AppSync: Validates schema, auth rules
3. Lambda (createOrder):
   a. Validates input structure
   b. Calculates totalPrice
   c. Writes to DynamoDB Orders table
4. Response: { orderId, status: 'PENDING', ... }
5. Frontend: Display order confirmation
```

### File Upload Flow

```
1. Frontend: client.mutations.presignAlbumUpload(input)
2. AppSync: Routes to presignAlbumUpload Lambda
3. Lambda:
   a. Validates file type and size
   b. Generates S3 presigned URL (albums/{albumId}/...)
   c. Returns URL (expires in 1 hour)
4. Frontend: PUT file directly to S3 using presigned URL
5. S3: Stores file, returns ETag
6. Frontend: Updates Album metadata via GraphQL
```

### Order Processing Flow

```
1. Frontend: updateOrderStatus(orderId, 'PROCESSING')
2. AppSync: Routes to updateOrderStatus Lambda
3. Lambda:
   a. Fetches current order
   b. Validates status transition
   c. Updates order in DynamoDB
4. Frontend: Calls processOrder(orderId)
5. AppSync: Routes to processOrder Lambda
6. Lambda (async):
   a. Processes payment (placeholder)
   b. Handles fulfillment (placeholder)
   c. Updates status to COMPLETED or FAILED
7. Frontend: Polls or subscribes to order updates
```

## Scalability Considerations

### DynamoDB

- **Capacity**: On-demand pricing (auto-scales)
- **GSIs**: Optimized for common query patterns
- **Streams**: Ready for event-driven processing

### Lambda

- **Concurrency**: Auto-scales per function
- **Cold starts**: Node.js 20 with minimal deps
- **Memory**: Default 1024 MB (adjustable)

### S3

- **Throughput**: Unlimited (prefix partitioning)
- **Lifecycle**: Automatic cost optimization
- **CDN**: Ready for CloudFront integration

## Monitoring & Observability

### CloudWatch Logs

- Function execution logs
- API Gateway logs (AppSync)
- Structured error logging

### CloudWatch Metrics

- Lambda invocations, duration, errors
- DynamoDB read/write capacity
- S3 request metrics

### Alarms (Future)

- High error rate on functions
- DynamoDB throttling
- S3 4xx/5xx errors

## Cost Optimization

1. **DynamoDB**: On-demand → provisioned for predictable load
2. **S3**: Lifecycle policies reduce storage costs
3. **Lambda**: Right-sized memory allocation
4. **CloudFront**: Cache static assets (future)
5. **API Gateway**: Caching enabled (future)

## Future Enhancements

### Short-term

- [ ] DynamoDB streams for event-driven processing
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] CloudFront CDN for S3 assets
- [ ] API caching and rate limiting

### Medium-term

- [ ] Real-time subscriptions (GraphQL subscriptions)
- [ ] Image processing pipeline (Lambda + S3 events)
- [ ] Email notifications (SES)
- [ ] Admin dashboard with analytics

### Long-term

- [ ] Multi-region deployment
- [ ] Advanced monitoring with X-Ray
- [ ] ML-powered image recommendations
- [ ] Mobile push notifications

## Deployment Strategy

### Sandbox (Development)

```bash
npx ampx sandbox
```

- Per-developer isolated environment
- Rapid iteration with hot-reload
- Automatic cleanup

### Staging

```bash
npx ampx pipeline deploy --branch staging
```

- Shared team environment
- Integration testing
- Production-like configuration

### Production

```bash
npx ampx pipeline deploy --branch main
```

- CI/CD with GitHub Actions
- Blue-green deployment
- Automated rollback on errors

## Disaster Recovery

### Backup Strategy

- **DynamoDB**: Point-in-time recovery enabled
- **S3**: Versioning enabled
- **Infrastructure**: All infrastructure as code (IaC)

### Recovery Time Objective (RTO)

- **Database**: < 1 hour (PITR restore)
- **Functions**: < 5 minutes (redeploy)
- **Storage**: Immediate (S3 versioning)

### Recovery Point Objective (RPO)

- **Database**: 5 minutes (continuous backup)
- **Storage**: 0 (versioned objects)

## Compliance & Best Practices

✅ Infrastructure as Code (Amplify Gen 2)  
✅ Least-privilege IAM policies  
✅ Encrypted at rest (DynamoDB, S3)  
✅ Encrypted in transit (HTTPS/TLS)  
✅ Input validation on all endpoints  
✅ Structured error handling  
✅ Audit logging (CloudWatch)  
✅ Secrets management (SSM/Secrets Manager ready)

## Support & Documentation

- **Main README**: Setup and usage instructions
- **SETUP.md**: Quick start guide
- **This file**: Architecture deep-dive
- **examples/**: Code samples for common use cases
