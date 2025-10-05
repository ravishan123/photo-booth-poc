import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
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
 * - Functions: Lambda functions for business logic
 */
const backend = defineBackend({
  auth,
  data,
  createOrder,
  getOrder,
  updateOrderStatus,
  listOrders,
  // presignUpload,
  processOrder,
});

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
    `https://${graphqlApiEndpoint}.appsync-api.${backend.data.resources.graphqlApi.stack.region}.amazonaws.com/graphql`
  );
});

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
