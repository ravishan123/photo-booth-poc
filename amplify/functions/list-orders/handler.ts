import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
// // @ts-ignore - Amplify Gen 2 runtime environment
// import { pro} from "$amplify/env/list-orders";

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

export const handler: Schema["listOrdersCustom"]["functionHandler"] = async (
  event
) => {
  try {
    const { customerEmail, status, type, limit, nextToken } = event.arguments;

    let result;

    if (customerEmail) {
      // Query by customer email
      result = await client.models.Order.listOrdersByCustomer(
        { customerEmail },
        {
          limit: limit || 20,
          nextToken: nextToken || undefined,
          sortDirection: "DESC",
        }
      );
    } else if (status) {
      // Query by status
      result = await client.models.Order.listOrdersByStatus(
        { status },
        {
          limit: limit || 20,
          nextToken: nextToken || undefined,
          sortDirection: "DESC",
        }
      );
    } else if (type) {
      // Query by type
      result = await client.models.Order.listOrdersByType(
        { type },
        {
          limit: limit || 20,
          nextToken: nextToken || undefined,
          sortDirection: "DESC",
        }
      );
    } else {
      // List all orders (fallback - might be slow for large datasets)
      result = await client.models.Order.list({
        limit: limit || 20,
        nextToken: nextToken || undefined,
      });
    }

    const { data: orders, errors, nextToken: responseNextToken } = result;

    if (errors) {
      console.error("Error listing orders:", errors);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to list orders",
          code: "LIST_ERROR",
        }),
      };
    }

    const formattedOrders = orders.map((order) => ({
      orderId: order.id,
      type: order.type,
      status: order.status,
      totalPrice: order.totalPrice,
      currency: order.currency,
      imageCount: order.imageCount,
      userDetails: JSON.parse(order.userDetails as string),
      metadata: order.metadata ? JSON.parse(order.metadata as string) : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        orders: formattedOrders,
        nextToken: responseNextToken,
        count: formattedOrders.length,
      }),
    };
  } catch (error) {
    console.error("Error listing orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    };
  }
};
