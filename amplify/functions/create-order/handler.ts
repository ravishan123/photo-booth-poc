import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
// @ts-ignore - Amplify Gen 2 runtime environment
import { env } from "$amplify/env/create-order";

// Configure Amplify
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

interface CreateOrderInput {
  customerId: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  currency?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateOrderInput(input: any): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!input.customerId || typeof input.customerId !== "string") {
    errors.push({
      field: "customerId",
      message: "Customer ID is required and must be a string",
    });
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    errors.push({ field: "items", message: "Items must be a non-empty array" });
  } else {
    input.items.forEach((item: any, index: number) => {
      if (!item.id || typeof item.id !== "string") {
        errors.push({
          field: `items[${index}].id`,
          message: "Item ID is required",
        });
      }
      if (!item.name || typeof item.name !== "string") {
        errors.push({
          field: `items[${index}].name`,
          message: "Item name is required",
        });
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: "Quantity must be a positive number",
        });
      }
      if (typeof item.price !== "number" || item.price < 0) {
        errors.push({
          field: `items[${index}].price`,
          message: "Price must be a non-negative number",
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export const handler: Schema["createOrderCustom"]["functionHandler"] = async (
  event
) => {
  try {
    const input: CreateOrderInput = event.arguments.input as CreateOrderInput;

    // Validate input
    const validation = validateOrderInput(input);
    if (!validation.valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: validation.errors,
        }),
      };
    }

    // Calculate total price
    const totalPrice = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const { data: order, errors } = await client.models.Order.create({
      customerId: input.customerId,
      status: "PENDING",
      totalPrice,
      currency: input.currency || "USD",
      items: JSON.stringify(input.items),
    });

    if (errors || !order) {
      console.error("Error creating order:", errors);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to create order",
          code: "CREATE_ERROR",
        }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        orderId: order.id,
        status: order.status,
        totalPrice: order.totalPrice,
        currency: order.currency,
        createdAt: order.createdAt,
      }),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    };
  }
};
