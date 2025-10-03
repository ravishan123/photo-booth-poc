# Frontend Integration Guide - Ape Moments Photo Booth

## Overview

This guide explains how to integrate the Ape Moments Photo Booth API with a frontend web application. We'll cover setup, authentication, API calls, file uploads, and complete implementation examples.

## Prerequisites

- Node.js 18+ and npm/yarn
- React, Vue, Angular, or vanilla JavaScript
- AWS Amplify Gen 2 backend deployed
- `amplify_outputs.json` file from your backend

## 1. Project Setup

### Install Dependencies

```bash
# For React/Next.js
npm install aws-amplify @aws-amplify/ui-react

# For Vue
npm install aws-amplify @aws-amplify/ui-vue

# For Angular
npm install aws-amplify @aws-amplify/ui-angular

# For vanilla JavaScript
npm install aws-amplify
```

### Configure Amplify

Create `src/amplify-config.ts` (or `amplify-config.js`):

```typescript
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

export default Amplify;
```

## 2. Authentication Setup

### Identity Pool Configuration

The API uses AWS Identity Pool for authentication. Configure it in your app:

```typescript
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure({
  ...outputs,
  Auth: {
    Cognito: {
      identityPoolId: outputs.custom.identityPoolId,
      userPoolId: outputs.custom.userPoolId,
      userPoolClientId: outputs.custom.userPoolClientId,
    },
  },
});
```

### Guest Access

For photo booth kiosks, you can use guest access:

```typescript
import { signIn } from "aws-amplify/auth";

// Sign in as guest
const signInAsGuest = async () => {
  try {
    await signIn({
      username: "guest",
      password: "guest123",
    });
  } catch (error) {
    // Handle guest sign-in error
    console.error("Guest sign-in failed:", error);
  }
};
```

## 3. API Integration Examples

### GraphQL Client Setup

```typescript
import { generateClient } from "aws-amplify/data";
import type { Schema } from "./amplify/data/resource";

const client = generateClient<Schema>();
```

### Order Management

#### Create Order

```typescript
interface OrderRequest {
  type: "album" | "collage";
  images: string[]; // Base64 encoded images or URLs
  userDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    specialInstructions?: string;
  };
  metadata?: {
    orientation?: "portrait" | "landscape";
    pageCount?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

const createOrder = async (input: OrderRequest) => {
  try {
    const result = await client.mutations.createOrderCustom({
      input: {
        type: input.type,
        images: input.images,
        userDetails: input.userDetails,
        metadata: input.metadata,
      },
    });

    if (result.data) {
      const response = JSON.parse(result.data);
      return {
        success: true,
        order: response.body,
      };
    }

    throw new Error("Failed to create order");
  } catch (error) {
    console.error("Create order error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Usage example
const newOrder = await createOrder({
  type: "album",
  images: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."],
  userDetails: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: "123 Main St",
    city: "New York",
    postalCode: "10001",
    specialInstructions: "Please make it extra glossy",
  },
  metadata: {
    orientation: "portrait",
    pageCount: 20,
    dimensions: {
      width: 8.5,
      height: 11,
    },
  },
});
```

#### Get Order Details

```typescript
const getOrderDetails = async (orderId: string) => {
  try {
    const result = await client.queries.getOrderDetails({
      orderId,
    });

    if (result.data) {
      const response = JSON.parse(result.data);
      return {
        success: true,
        order: response.body,
      };
    }

    throw new Error("Order not found");
  } catch (error) {
    console.error("Get order error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

#### List Orders

```typescript
interface ListOrdersParams {
  customerEmail?: string;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  type?: "album" | "collage";
  limit?: number;
  nextToken?: string;
}

const listOrders = async (params: ListOrdersParams = {}) => {
  try {
    const result = await client.queries.listOrdersCustom({
      customerEmail: params.customerEmail,
      status: params.status,
      type: params.type,
      limit: params.limit || 20,
      nextToken: params.nextToken,
    });

    if (result.data) {
      const response = JSON.parse(result.data);
      return {
        success: true,
        orders: response.body.orders,
        nextToken: response.body.nextToken,
        count: response.body.count,
      };
    }

    throw new Error("Failed to list orders");
  } catch (error) {
    console.error("List orders error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

#### Update Order Status

```typescript
const updateOrderStatus = async (
  orderId: string,
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
  errorMessage?: string
) => {
  try {
    const result = await client.mutations.updateOrderStatus({
      orderId,
      status,
      errorMessage,
    });

    if (result.data) {
      const response = JSON.parse(result.data);
      return {
        success: true,
        order: response.body,
      };
    }

    throw new Error("Failed to update order status");
  } catch (error) {
    console.error("Update order status error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

## 4. File Upload Implementation

### Album Upload

```typescript
interface UploadFileParams {
  albumId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

const uploadAlbumFile = async ({
  albumId,
  file,
  onProgress,
}: UploadFileParams) => {
  try {
    // Step 1: Get presigned URL
    const presignResult = await client.mutations.presignAlbumUpload({
      input: {
        albumId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      },
    });

    if (!presignResult.data) {
      throw new Error("Failed to get presigned URL");
    }

    const presignResponse = JSON.parse(presignResult.data);
    const { uploadUrl, key } = presignResponse.body;

    // Step 2: Upload file to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Upload failed");
    }

    return {
      success: true,
      key,
      url: uploadUrl.split("?")[0], // Remove query parameters
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Usage with progress tracking
const uploadWithProgress = async (albumId: string, file: File) => {
  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    // First get presigned URL
    client.mutations
      .presignAlbumUpload({
        input: {
          albumId,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        },
      })
      .then((result) => {
        if (!result.data) {
          reject(new Error("Failed to get presigned URL"));
          return;
        }

        const presignResponse = JSON.parse(result.data);
        const { uploadUrl } = presignResponse.body;

        // Upload with progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            console.log(`Upload progress: ${progress}%`);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve({ success: true, key: presignResponse.body.key });
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
  });
};
```

### Collage Upload

```typescript
const uploadCollageFile = async ({
  collageId,
  file,
}: {
  collageId: string;
  file: File;
}) => {
  try {
    // Get presigned URL
    const presignResult = await client.mutations.presignCollageUpload({
      input: {
        collageId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      },
    });

    if (!presignResult.data) {
      throw new Error("Failed to get presigned URL");
    }

    const presignResponse = JSON.parse(presignResult.data);
    const { uploadUrl, key } = presignResponse.body;

    // Upload file
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Upload failed");
    }

    return {
      success: true,
      key,
      url: uploadUrl.split("?")[0],
    };
  } catch (error) {
    console.error("Collage upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

## 5. Complete React Component Example

### Photo Booth Order Component

```tsx
import React, { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "./amplify/data/resource";

const client = generateClient<Schema>();

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const PhotoBoothOrder: React.FC = () => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    specialInstructions: "",
  });

  const createOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        type: "album" as const,
        images: images,
        userDetails: userDetails,
        metadata: {
          orientation: "portrait" as const,
          pageCount: images.length,
        },
      };

      const result = await client.mutations.createOrderCustom({
        input: orderData,
      });

      if (result.data) {
        const response = JSON.parse(result.data);
        setOrder(response.body);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setUserDetails((prev) => ({ ...prev, [field]: value }));
  };

  const uploadPhotos = async (files: FileList) => {
    if (!order) return;

    const albumId = `album-${order.orderId}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Get presigned URL
        const presignResult = await client.mutations.presignAlbumUpload({
          input: {
            albumId,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          },
        });

        if (!presignResult.data) {
          throw new Error("Failed to get presigned URL");
        }

        const presignResponse = JSON.parse(presignResult.data);
        const { uploadUrl } = presignResponse.body;

        // Upload with progress
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress =
                ((i + event.loaded / event.total) / files.length) * 100;
              setUploadProgress(Math.round(progress));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              resolve(true);
            } else {
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"));
          });

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    // Update order status to PROCESSING
    await client.mutations.updateOrderStatus({
      orderId: order.orderId,
      status: "PROCESSING",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadPhotos(files);
    }
  };

  return (
    <div className="photo-booth-order">
      <h2>Photo Booth Order</h2>

      {!order ? (
        <div>
          <button
            onClick={createOrder}
            disabled={loading}
            className="create-order-btn"
          >
            {loading ? "Creating Order..." : "Start Photo Session"}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      ) : (
        <div>
          <div className="order-info">
            <h3>Order #{order.orderId}</h3>
            <p>Status: {order.status}</p>
            <p>Total: ${order.totalPrice}</p>
          </div>

          <div className="upload-section">
            <h4>Upload Photos</h4>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />

            {uploadProgress > 0 && (
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
                <span>{uploadProgress}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoBoothOrder;
```

## 6. Error Handling Best Practices

### API Error Handler

```typescript
interface ApiError {
  message: string;
  code: string;
  errors?: Array<{ field: string; message: string }>;
}

const handleApiError = (error: any): ApiError => {
  if (error.response?.data) {
    return error.response.data;
  }

  if (error.message) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
};

// Usage in components
const handleOrderCreation = async () => {
  try {
    const result = await createOrder(orderData);
    if (!result.success) {
      const error = handleApiError(result.error);
      setError(error.message);
    }
  } catch (err) {
    const error = handleApiError(err);
    setError(error.message);
  }
};
```

## 7. State Management (Redux/Zustand Example)

### Zustand Store

```typescript
import { create } from "zustand";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "./amplify/data/resource";

const client = generateClient<Schema>();

interface Order {
  orderId: string;
  customerId: string;
  status: string;
  totalPrice: number;
  currency: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;

  // Actions
  createOrder: (input: any) => Promise<void>;
  getOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  uploadFile: (albumId: string, file: File) => Promise<void>;
  clearError: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  createOrder: async (input) => {
    set({ loading: true, error: null });

    try {
      const result = await client.mutations.createOrderCustom({ input });

      if (result.data) {
        const response = JSON.parse(result.data);
        set({
          currentOrder: response.body,
          loading: false,
        });
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
    }
  },

  getOrder: async (orderId) => {
    set({ loading: true, error: null });

    try {
      const result = await client.queries.getOrderDetails({ orderId });

      if (result.data) {
        const response = JSON.parse(result.data);
        set({
          currentOrder: response.body,
          loading: false,
        });
      } else {
        throw new Error("Order not found");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null });

    try {
      const result = await client.mutations.updateOrderStatus({
        orderId,
        status,
      });

      if (result.data) {
        const response = JSON.parse(result.data);
        set({
          currentOrder: response.body,
          loading: false,
        });
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
    }
  },

  uploadFile: async (albumId, file) => {
    set({ loading: true, error: null });

    try {
      // Get presigned URL
      const presignResult = await client.mutations.presignAlbumUpload({
        input: {
          albumId,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        },
      });

      if (!presignResult.data) {
        throw new Error("Failed to get presigned URL");
      }

      const presignResponse = JSON.parse(presignResult.data);
      const { uploadUrl } = presignResponse.body;

      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Upload failed",
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
```

## 8. Testing Your Integration

### Test Order Creation

```typescript
// Test script
const testOrderCreation = async () => {
  const testOrder = {
    customerId: "test-customer-123",
    items: [
      {
        id: "test-package",
        name: "Test Photo Package",
        quantity: 1,
        price: 20.0,
      },
    ],
    currency: "USD",
  };

  const result = await createOrder(testOrder);
  console.log("Order creation result:", result);

  if (result.success) {
    console.log("✅ Order created successfully:", result.order);
  } else {
    console.error("❌ Order creation failed:", result.error);
  }
};

// Run test
testOrderCreation();
```

### Test File Upload

```typescript
const testFileUpload = async () => {
  // Create a test file
  const testFile = new File(["test content"], "test.jpg", {
    type: "image/jpeg",
  });

  const result = await uploadAlbumFile({
    albumId: "test-album-123",
    file: testFile,
  });

  console.log("Upload result:", result);

  if (result.success) {
    console.log("✅ File uploaded successfully:", result.key);
  } else {
    console.error("❌ File upload failed:", result.error);
  }
};
```

## 9. Production Considerations

### Environment Configuration

```typescript
// config/environment.ts
export const config = {
  development: {
    apiEndpoint:
      "https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql",
    region: "us-east-1",
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  production: {
    apiEndpoint: process.env.REACT_APP_API_ENDPOINT,
    region: process.env.REACT_APP_AWS_REGION,
    maxFileSize: 25 * 1024 * 1024, // 25MB
  },
};

export const getConfig = () => {
  const env = process.env.NODE_ENV || "development";
  return config[env as keyof typeof config];
};
```

### Performance Optimization

```typescript
// Implement retry logic for failed uploads
const uploadWithRetry = async (params: UploadFileParams, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadAlbumFile(params);
      if (result.success) {
        return result;
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Implement batch uploads
const uploadMultipleFiles = async (albumId: string, files: File[]) => {
  const uploadPromises = files.map((file) =>
    uploadWithRetry({ albumId, file })
  );

  const results = await Promise.allSettled(uploadPromises);

  const successful = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<any>).value);

  const failed = results
    .filter((result) => result.status === "rejected")
    .map((result) => (result as PromiseRejectedResult).reason);

  return { successful, failed };
};
```

This comprehensive guide provides everything you need to integrate the Ape Moments Photo Booth API with your frontend application. The examples cover React, but the patterns can be adapted to any frontend framework.
