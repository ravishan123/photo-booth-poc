import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
// @ts-ignore - Amplify Gen 2 runtime environment
///import { env } from "$amplify/env/update-order-status";

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!,
        region: process.env.AWS_REGION!,
        defaultAuthMode: "identityPool",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN!,
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

type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

function isValidTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(newStatus);
}

export const handler: Schema["updateOrderStatus"]["functionHandler"] = async (
  event
) => {
  try {
    const { orderId, status, errorMessage } = event.arguments;

    if (!orderId || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Order ID and status are required",
          code: "VALIDATION_ERROR",
        }),
      };
    }

    // Fetch current order
    const { data: currentOrder, errors: fetchErrors } =
      await client.models.Order.get({ id: orderId });

    if (fetchErrors || !currentOrder) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Order not found",
          code: "NOT_FOUND",
        }),
      };
    }

    // Validate status transition
    const currentStatus = currentOrder.status as OrderStatus;
    const newStatus = status as OrderStatus;

    if (!isValidTransition(currentStatus, newStatus)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          code: "INVALID_TRANSITION",
          allowedTransitions: ALLOWED_TRANSITIONS[currentStatus],
        }),
      };
    }

    // Update order
    const updateData: any = {
      id: orderId,
      status: newStatus,
    };

    if (errorMessage && newStatus === "FAILED") {
      updateData.errorMessage = errorMessage;
    }

    const { data: updatedOrder, errors: updateErrors } =
      await client.models.Order.update(updateData);

    if (updateErrors || !updatedOrder) {
      console.error("Error updating order:", updateErrors);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to update order status",
          code: "UPDATE_ERROR",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        errorMessage: updatedOrder.errorMessage,
        updatedAt: updatedOrder.updatedAt,
      }),
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    };
  }
};
