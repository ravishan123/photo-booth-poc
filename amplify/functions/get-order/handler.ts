import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
// @ts-ignore - Amplify Gen 2 runtime environment
import { env } from "$amplify/env/get-order";

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

export const handler: Schema["getOrderDetails"]["functionHandler"] = async (
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

    const { data: order, errors } = await client.models.Order.get({
      id: orderId,
    });

    if (errors || !order) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Order not found",
          code: "NOT_FOUND",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId: order.id,
        customerId: order.customerId,
        status: order.status,
        totalPrice: order.totalPrice,
        currency: order.currency,
        items: JSON.parse(order.items as string),
        errorMessage: order.errorMessage,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }),
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    };
  }
};
