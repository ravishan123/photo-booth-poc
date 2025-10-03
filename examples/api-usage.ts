/**
 * Ape Moments API Usage Examples
 *
 * This file demonstrates how to use the backend API from your frontend application.
 */

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import outputs from "../amplify_outputs.json";

// Configure Amplify
Amplify.configure(outputs);

// Generate typed client
const client = generateClient<Schema>();

/**
 * Example 1: Create an Order
 */
export async function createOrderExample() {
  try {
    const { data, errors } = await client.mutations.createOrder({
      input: {
        customerId: "customer-123",
        items: [
          {
            id: "print-001",
            name: "4x6 Photo Print",
            quantity: 10,
            price: 0.99,
          },
          {
            id: "album-001",
            name: "Photo Album",
            quantity: 1,
            price: 29.99,
          },
        ],
        currency: "USD",
      },
    });

    if (errors) {
      console.error("Error creating order:", errors);
      return null;
    }

    const response = JSON.parse(data as string);
    console.log("Order created:", response);
    return response;
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
}

/**
 * Example 2: Get Order by ID
 */
export async function getOrderExample(orderId: string) {
  try {
    const { data, errors } = await client.queries.getOrder({
      orderId,
    });

    if (errors) {
      console.error("Error fetching order:", errors);
      return null;
    }

    const response = JSON.parse(data as string);
    console.log("Order details:", response);
    return response;
  } catch (error) {
    console.error("Failed to fetch order:", error);
    throw error;
  }
}

/**
 * Example 3: Update Order Status
 */
export async function updateOrderStatusExample(
  orderId: string,
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
) {
  try {
    const { data, errors } = await client.mutations.updateOrderStatus({
      orderId,
      status,
    });

    if (errors) {
      console.error("Error updating order status:", errors);
      return null;
    }

    const response = JSON.parse(data as string);
    console.log("Order updated:", response);
    return response;
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
}

/**
 * Example 4: List Orders by Customer
 */
export async function listOrdersByCustomerExample(customerId: string) {
  try {
    const { data, errors } = await client.queries.listOrders({
      customerId,
      limit: 20,
    });

    if (errors) {
      console.error("Error listing orders:", errors);
      return null;
    }

    const response = JSON.parse(data as string);
    console.log("Orders:", response);
    return response;
  } catch (error) {
    console.error("Failed to list orders:", error);
    throw error;
  }
}

/**
 * Example 5: Get Presigned URL for Album Upload
 */
export async function getAlbumUploadUrlExample(albumId: string, file: File) {
  try {
    const { data, errors } = await client.mutations.presignAlbumUpload({
      input: {
        albumId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      },
    });

    if (errors) {
      console.error("Error getting presigned URL:", errors);
      return null;
    }

    const response = JSON.parse(data as string);
    console.log("Presigned URL:", response);
    return response;
  } catch (error) {
    console.error("Failed to get presigned URL:", error);
    throw error;
  }
}

/**
 * Example 6: Upload File to S3 using Presigned URL
 */
export async function uploadFileToS3Example(file: File, presignedUrl: string) {
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    console.log("File uploaded successfully");
    return {
      success: true,
      etag: response.headers.get("ETag"),
    };
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw error;
  }
}

/**
 * Example 7: Complete Album Upload Flow
 */
export async function completeAlbumUploadExample(
  albumId: string,
  files: File[]
) {
  try {
    console.log(`Uploading ${files.length} files for album ${albumId}...`);

    const uploadResults = [];

    for (const file of files) {
      // Get presigned URL
      const presignedData = await getAlbumUploadUrlExample(albumId, file);
      if (!presignedData) {
        throw new Error(`Failed to get presigned URL for ${file.name}`);
      }

      // Upload file
      const uploadResult = await uploadFileToS3Example(
        file,
        presignedData.uploadUrl
      );

      uploadResults.push({
        fileName: file.name,
        key: presignedData.key,
        etag: uploadResult.etag,
      });

      console.log(`✓ Uploaded ${file.name}`);
    }

    console.log("All files uploaded successfully!");
    return uploadResults;
  } catch (error) {
    console.error("Failed to complete album upload:", error);
    throw error;
  }
}

/**
 * Example 8: Create Album with Model API
 */
export async function createAlbumExample(
  customerId: string,
  name: string,
  albumId: string
) {
  try {
    const { data, errors } = await client.models.Album.create({
      albumId,
      customerId,
      name,
      s3Prefix: `albums/${albumId}/`,
      status: "UPLOADING",
      imageCount: 0,
    });

    if (errors) {
      console.error("Error creating album:", errors);
      return null;
    }

    console.log("Album created:", data);
    return data;
  } catch (error) {
    console.error("Failed to create album:", error);
    throw error;
  }
}

/**
 * Example 9: List Albums by Customer
 */
export async function listAlbumsByCustomerExample(customerId: string) {
  try {
    const { data, errors } = await client.models.Album.listAlbumsByCustomer(
      { customerId },
      {
        limit: 20,
        sortDirection: "DESC",
      }
    );

    if (errors) {
      console.error("Error listing albums:", errors);
      return null;
    }

    console.log("Albums:", data);
    return data;
  } catch (error) {
    console.error("Failed to list albums:", error);
    throw error;
  }
}

/**
 * Example 10: Process Order (Async)
 */
export async function processOrderExample(orderId: string) {
  try {
    // First update status to PROCESSING
    await updateOrderStatusExample(orderId, "PROCESSING");

    // Then trigger async processing
    const { data, errors } = await client.mutations.processOrder({
      orderId,
    });

    if (errors) {
      console.error("Error processing order:", errors);
      return null;
    }

    const response = JSON.parse(data as string);
    console.log("Order processing result:", response);
    return response;
  } catch (error) {
    console.error("Failed to process order:", error);
    throw error;
  }
}

/**
 * Example Usage in React Component
 */
export function ExampleReactComponent() {
  const handleCreateOrder = async () => {
    const order = await createOrderExample();
    if (order) {
      console.log("Order ID:", order.orderId);
    }
  };

  const handleUploadPhotos = async (albumId: string, files: FileList) => {
    const fileArray = Array.from(files);
    await completeAlbumUploadExample(albumId, fileArray);
  };

  return {
    handleCreateOrder,
    handleUploadPhotos,
  };
}
