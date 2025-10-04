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
  type: "album" | "collage";
  images: string; // UUID string
  userDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    specialInstructions?: string;
  };
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

  if (!input.type || !["album", "collage"].includes(input.type)) {
    errors.push({
      field: "type",
      message: "Type is required and must be 'album' or 'collage'",
    });
  }

  if (
    !input.images ||
    typeof input.images !== "string" ||
    input.images.trim() === ""
  ) {
    errors.push({
      field: "images",
      message: "Images must be a valid UUID string",
    });
  }

  if (!input.userDetails || typeof input.userDetails !== "object") {
    errors.push({
      field: "userDetails",
      message: "User details are required",
    });
  } else {
    const requiredFields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "postalCode",
    ];
    requiredFields.forEach((field) => {
      if (
        !input.userDetails[field] ||
        typeof input.userDetails[field] !== "string"
      ) {
        errors.push({
          field: `userDetails.${field}`,
          message: `${field} is required`,
        });
      }
    });

    // Validate email format
    if (
      input.userDetails.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.userDetails.email)
    ) {
      errors.push({
        field: "userDetails.email",
        message: "Invalid email format",
      });
    }
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

    // Calculate total price based on type
    let totalPrice = 0;
    if (input.type === "album") {
      // Album pricing: $5 base fee
      totalPrice = 5;
    } else if (input.type === "collage") {
      // Collage pricing: $3 base fee
      totalPrice = 3;
    }

    // Create order
    const { data: order, errors } = await client.models.Order.create({
      customerEmail: input.userDetails.email,
      type: input.type,
      status: "PENDING",
      totalPrice,
      currency: "USD",
      imageCount: 1, // Single UUID represents the order
      images: input.images, // Store the UUID string directly
      userDetails: JSON.stringify(input.userDetails),
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
        type: order.type,
        status: order.status,
        totalPrice: order.totalPrice,
        currency: order.currency,
        imageCount: order.imageCount,
        images: order.images,
        userDetails: JSON.parse(order.userDetails as string),
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
