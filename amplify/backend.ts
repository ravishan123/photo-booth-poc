import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { createOrder } from "./functions/create-order/resource";
import { getOrder } from "./functions/get-order/resource";
import { updateOrderStatus } from "./functions/update-order-status/resource";
import { listOrders } from "./functions/list-orders/resource";
// import { presignUpload } from "./functions/presign-upload/resource";
import { processOrder } from "./functions/process-order/resource";

/**
 * Ape Moments Photo Booth Backend
 *
 * Architecture:
 * - Auth: Cognito with email login (ready for future expansion)
 * - Data: GraphQL API with DynamoDB (Orders, Albums, Collages)
 * - Storage: S3 bucket with organized prefixes for albums and collages
 * - Functions: Lambda functions for business logic and S3 presigned URLs
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  createOrder,
  getOrder,
  updateOrderStatus,
  listOrders,
  // presignUpload,
  processOrder,
});

// Configure S3 bucket with CORS and lifecycle policies
const s3Bucket = backend.storage.resources.bucket;
const cfnBucket = s3Bucket.node.defaultChild as any;

// CORS Configuration
cfnBucket.corsConfiguration = {
  corsRules: [
    {
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      allowedHeaders: ["*"],
      exposedHeaders: ["ETag", "Location"],
      maxAge: 3000,
    },
  ],
};

// Lifecycle Configuration
cfnBucket.lifecycleConfiguration = {
  rules: [
    {
      id: "TransitionNoncurrentVersions",
      status: "Enabled",
      noncurrentVersionTransitions: [
        {
          storageClass: "STANDARD_IA",
          transitionInDays: 30,
        },
      ],
    },
    {
      id: "ExpireTempUploads",
      status: "Enabled",
      prefix: "temp/",
      expirationInDays: 7,
    },
  ],
};

// Grant S3 permissions to presign functions (least privilege - scoped to specific prefixes)
// Album upload function - can only write to albums/* prefix
// backend.presignAlbumUpload.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: ["s3:PutObject", "s3:PutObjectAcl"],
//     resources: [`${s3Bucket.bucketArn}/albums/*`],
//   })
// );

// backend.presignAlbumUpload.addEnvironment(
//   "AMPLIFY_STORAGE_BUCKET_NAME",
//   s3Bucket.bucketName
// );

// // Collage upload function - can only write to collages/* prefix
// backend.presignCollageUpload.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: ["s3:PutObject", "s3:PutObjectAcl"],
//     resources: [`${s3Bucket.bucketArn}/collages/*`],
//   })
// );

// backend.presignCollageUpload.addEnvironment(
//   "AMPLIFY_STORAGE_BUCKET_NAME",
//   s3Bucket.bucketName
// );

// Grant Data API access to all functions
const dataResources = backend.data.resources;
const graphqlApiEndpoint = dataResources.graphqlApi.apiId;

[
  backend.createOrder,
  backend.getOrder,
  backend.updateOrderStatus,
  backend.listOrders,
  // backend.presignUpload,
  backend.processOrder,
].forEach((fn) => {
  // GraphQL endpoint will be available via environment variables automatically
  fn.addEnvironment(
    "AMPLIFY_DATA_GRAPHQL_ENDPOINT",
    `https://${graphqlApiEndpoint}.appsync-api.${backend.storage.resources.bucket.stack.region}.amazonaws.com/graphql`
  );
});

// Add S3 bucket name to presign upload function
// backend.presignUpload.addEnvironment(
//   "AMPLIFY_STORAGE_BUCKET_NAME",
//   s3Bucket.bucketName
// );
// backend.presignUpload.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: ["s3:PutObject"],
//     resources: [
//       `${s3Bucket.bucketArn}/albums/*`,
//       `${s3Bucket.bucketArn}/collages/*`,
//     ],
//   })
// );

// Add rate limiting/throttling for public endpoints
// Note: This is handled at the API Gateway level in Amplify Gen 2
// You can configure this in the AWS Console or via CDK customizations

/**
 * Outputs for frontend configuration
 * These will be automatically written to amplify_outputs.json
 * Note: aws_region is automatically provided by Amplify built-in resources
 */
backend.addOutput({
  custom: {
    apiId: graphqlApiEndpoint,
    environment: "development",
  },
});
