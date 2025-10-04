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

interface SimplifiedOrderInput {
  type: "album" | "collage";
  pdfUuid: string; // UUID of the PDF uploaded to S3
  customerEmail: string;
  phone: string;
  totalPrice: number;
  address: string;
  city: string;
  postalCode: string;
  name?: string; // Optional - will extract from email if not provided
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  specialInstructions?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateSimplifiedOrderInput(input: any): {
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

  if (!input.pdfUuid || typeof input.pdfUuid !== "string") {
    errors.push({
      field: "pdfUuid",
      message: "PDF UUID is required",
    });
  }

  if (!input.customerEmail || typeof input.customerEmail !== "string") {
    errors.push({
      field: "customerEmail",
      message: "Customer email is required",
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)) {
    errors.push({
      field: "customerEmail",
      message: "Invalid email format",
    });
  }

  if (!input.phone || typeof input.phone !== "string") {
    errors.push({
      field: "phone",
      message: "Phone number is required",
    });
  }

  if (!input.address || typeof input.address !== "string") {
    errors.push({
      field: "address",
      message: "Address is required",
    });
  }

  if (!input.city || typeof input.city !== "string") {
    errors.push({
      field: "city",
      message: "City is required",
    });
  }

  if (!input.postalCode || typeof input.postalCode !== "string") {
    errors.push({
      field: "postalCode",
      message: "Postal code is required",
    });
  }

  if (typeof input.totalPrice !== "number" || input.totalPrice <= 0) {
    errors.push({
      field: "totalPrice",
      message: "Total price must be a positive number",
    });
  }

  return { valid: errors.length === 0, errors };
}

// Function to generate user details from provided information
async function generateUserDetails(
  email: string,
  phone: string,
  address: string,
  city: string,
  postalCode: string,
  providedName?: string
): Promise<UserDetails> {
  // Use provided name or extract from email
  let name: string;
  if (providedName && providedName.trim()) {
    name = providedName.trim();
  } else {
    const emailParts = email.split("@");
    name = emailParts[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return {
    name: name,
    email: email,
    phone: phone,
    address: address,
    city: city,
    postalCode: postalCode,
    specialInstructions: "Provided by customer",
  };
}

// Function to generate metadata based on order type and PDF UUID
function generateMetadata(type: string, pdfUuid: string) {
  if (type === "album") {
    return {
      pdfUuid: pdfUuid,
      orientation: "portrait",
      pageCount: "calculated_from_pdf",
      dimensions: {
        width: 8,
        height: 10,
      },
      paperType: "glossy",
      binding: "spiral",
      s3Path: `albums/${pdfUuid}.pdf`,
    };
  } else if (type === "collage") {
    return {
      pdfUuid: pdfUuid,
      template: "custom_layout",
      background: "white",
      spacing: 10,
      borderRadius: 5,
      outputFormat: "high-res",
      s3Path: `collages/${pdfUuid}.pdf`,
    };
  }

  return {};
}

export const handler: Schema["createOrderCustom"]["functionHandler"] = async (
  event
) => {
  try {
    const input: SimplifiedOrderInput = event.arguments
      .input as SimplifiedOrderInput;

    // Validate simplified input
    const validation = validateSimplifiedOrderInput(input);
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

    // Generate user details from provided input
    const userDetails = await generateUserDetails(
      input.customerEmail,
      input.phone,
      input.address,
      input.city,
      input.postalCode,
      input.name
    );

    // Generate metadata based on order type and PDF UUID
    const metadata = generateMetadata(input.type, input.pdfUuid);

    // Create order with backend-generated data
    const { data: order, errors } = await client.models.Order.create({
      customerEmail: input.customerEmail,
      type: input.type,
      status: "PENDING",
      totalPrice: input.totalPrice,
      currency: "USD",
      imageCount: 1, // PDF contains multiple images
      images: JSON.stringify([
        `https://s3.amazonaws.com/bucket/${input.type}s/${input.pdfUuid}.pdf`,
      ]),
      userDetails: JSON.stringify(userDetails),
      metadata: JSON.stringify(metadata),
      // Backend generates these automatically:
      // - id: UUID generated by DynamoDB
      // - createdAt: Current timestamp
      // - updatedAt: Current timestamp
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
        orderId: order.id, // Backend-generated UUID
        type: order.type,
        status: order.status,
        totalPrice: order.totalPrice,
        currency: order.currency,
        imageCount: order.imageCount,
        customerEmail: order.customerEmail,
        userDetails: JSON.parse(order.userDetails as string),
        metadata: JSON.parse(order.metadata as string),
        createdAt: order.createdAt, // Backend-generated timestamp
        updatedAt: order.updatedAt, // Backend-generated timestamp
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
