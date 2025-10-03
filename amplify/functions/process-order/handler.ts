import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
// @ts-ignore - Amplify Gen 2 runtime environment
import { env } from "$amplify/env/process-order";

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
        region: env.AWS_REGION,
        defaultAuthMode: "identityPool",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            sessionToken: env.AWS_SESSION_TOKEN,
          },
        }),
        clearCredentialsAndIdentityId: () => {
          /* noop */
        },
      },
    },
  }
);

const client = generateClient<Schema>();

/**
 * Async order processor - can be triggered by DynamoDB streams or invoked directly
 * Placeholder for payment processing, fulfillment, and other async operations
 */
export const handler: Schema["processOrder"]["functionHandler"] = async (
  event
) => {
  try {
    const { orderId } = event.arguments;

    if (!orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Order ID is required",
          code: "VALIDATION_ERROR",
        }),
      };
    }

    // Fetch order
    const { data: order, errors: fetchErrors } = await client.models.Order.get({
      id: orderId,
    });

    if (fetchErrors || !order) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Order not found",
          code: "NOT_FOUND",
        }),
      };
    }

    // Only process orders in PROCESSING status
    if (order.status !== "PROCESSING") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Order must be in PROCESSING status. Current status: ${order.status}`,
          code: "INVALID_STATUS",
        }),
      };
    }

    console.log(`Processing order ${orderId}...`);

    // Simulate processing (replace with actual payment/fulfillment logic)
    try {
      // TODO: Implement payment processing
      // const paymentResult = await processPayment(order);

      // TODO: Implement fulfillment
      // const fulfillmentResult = await fulfillOrder(order);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update order to COMPLETED
      const { data: updatedOrder, errors: updateErrors } =
        await client.models.Order.update({
          id: orderId,
          status: "COMPLETED",
        });

      if (updateErrors || !updatedOrder) {
        throw new Error("Failed to update order status");
      }

      console.log(`Order ${orderId} processed successfully`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          message: "Order processed successfully",
        }),
      };
    } catch (processingError) {
      console.error(`Error processing order ${orderId}:`, processingError);

      // Update order to FAILED
      await client.models.Order.update({
        id: orderId,
        status: "FAILED",
        errorMessage:
          processingError instanceof Error
            ? processingError.message
            : "Processing failed",
      });

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Order processing failed",
          code: "PROCESSING_ERROR",
          error:
            processingError instanceof Error
              ? processingError.message
              : "Unknown error",
        }),
      };
    }
  } catch (error) {
    console.error("Error in process order handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    };
  }
};
