# Frontend Setup Guide - Step by Step

## Quick Start Checklist

This guide will walk you through setting up a frontend web application to work with your Ape Moments Photo Booth API.

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] AWS Amplify Gen 2 backend deployed
- [ ] `amplify_outputs.json` file available
- [ ] Basic knowledge of React/Vue/Angular (choose one)

## Step 1: Choose Your Frontend Framework

### Option A: React (Recommended)

```bash
npx create-react-app ape-moments-frontend --template typescript
cd ape-moments-frontend
```

### Option B: Next.js

```bash
npx create-next-app@latest ape-moments-frontend --typescript --tailwind --eslint
cd ape-moments-frontend
```

### Option C: Vue.js

```bash
npm create vue@latest ape-moments-frontend
cd ape-moments-frontend
npm install
```

### Option D: Angular

```bash
ng new ape-moments-frontend --routing --style=css
cd ape-moments-frontend
```

## Step 2: Install AWS Amplify

### For React/Next.js

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### For Vue

```bash
npm install aws-amplify @aws-amplify/ui-vue
```

### For Angular

```bash
npm install aws-amplify @aws-amplify/ui-angular
```

### For Vanilla JavaScript

```bash
npm install aws-amplify
```

## Step 3: Configure Amplify

### 3.1 Copy amplify_outputs.json

Copy your `amplify_outputs.json` file to your frontend project root:

```bash
# From your backend project
cp amplify_outputs.json ../ape-moments-frontend/
```

### 3.2 Create Amplify Configuration

Create `src/amplify-config.ts`:

```typescript
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// Configure Amplify with your backend outputs
Amplify.configure(outputs);

export default Amplify;
```

### 3.3 Initialize in Your App

#### For React (App.tsx or index.tsx):

```typescript
import React from 'react';
import './amplify-config'; // Import configuration
import PhotoBoothApp from './components/PhotoBoothApp';

function App() {
  return (
    <div className="App">
      <PhotoBoothApp />
    </div>
  );
}

export default App;
```

#### For Next.js (pages/\_app.tsx or app/layout.tsx):

```typescript
import type { AppProps } from 'next/app';
import '../src/amplify-config';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

#### For Vue (main.ts):

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import "./amplify-config";

createApp(App).mount("#app");
```

## Step 4: Create API Service Layer

### 4.1 Create API Client

Create `src/services/api.ts`:

```typescript
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: OrderItem[];
  currency?: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalPrice: number;
  currency: string;
  items: OrderItem[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export class PhotoBoothAPI {
  // Create Order
  static async createOrder(input: CreateOrderInput) {
    try {
      const result = await client.mutations.createOrderCustom({ input });

      if (result.data) {
        const response = JSON.parse(result.data);
        return {
          success: true,
          order: response.body,
        };
      }

      throw new Error("Failed to create order");
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get Order Details
  static async getOrder(orderId: string) {
    try {
      const result = await client.queries.getOrderDetails({ orderId });

      if (result.data) {
        const response = JSON.parse(result.data);
        return {
          success: true,
          order: response.body,
        };
      }

      throw new Error("Order not found");
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // List Orders
  static async listOrders(
    params: {
      customerId?: string;
      status?: string;
      limit?: number;
      nextToken?: string;
    } = {}
  ) {
    try {
      const result = await client.queries.listOrdersCustom(params);

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
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Update Order Status
  static async updateOrderStatus(
    orderId: string,
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
    errorMessage?: string
  ) {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get Presigned Upload URL
  static async getPresignedUploadUrl(
    type: "album" | "collage",
    params: {
      id: string;
      fileName: string;
      contentType: string;
      fileSize?: number;
    }
  ) {
    try {
      const mutation =
        type === "album"
          ? client.mutations.presignAlbumUpload
          : client.mutations.presignCollageUpload;

      const result = await mutation({
        input: {
          [`${type}Id`]: params.id,
          fileName: params.fileName,
          contentType: params.contentType,
          fileSize: params.fileSize,
        },
      });

      if (result.data) {
        const response = JSON.parse(result.data);
        return {
          success: true,
          uploadUrl: response.body.uploadUrl,
          key: response.body.key,
          bucket: response.body.bucket,
          expiresIn: response.body.expiresIn,
        };
      }

      throw new Error("Failed to get presigned URL");
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Upload File
  static async uploadFile(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.round(progress));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve({ success: true });
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
  }
}
```

## Step 5: Create Core Components

### 5.1 Order Creation Component

Create `src/components/CreateOrder.tsx`:

```tsx
import React, { useState } from "react";
import {
  PhotoBoothAPI,
  type CreateOrderInput,
  type OrderItem,
} from "../services/api";

const CreateOrder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);

    const orderData: CreateOrderInput = {
      customerId: `customer-${Date.now()}`,
      items: [
        {
          id: "photo-package-1",
          name: "Digital Photo Package",
          quantity: 1,
          price: 25.0,
        },
      ],
      currency: "USD",
    };

    const result = await PhotoBoothAPI.createOrder(orderData);

    if (result.success) {
      setOrder(result.order);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="create-order">
      <h2>Create Photo Booth Order</h2>

      {!order ? (
        <div>
          <button
            onClick={handleCreateOrder}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Creating..." : "Start Photo Session"}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      ) : (
        <div className="order-success">
          <h3>Order Created Successfully!</h3>
          <p>
            <strong>Order ID:</strong> {order.orderId}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Total:</strong> ${order.totalPrice}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
```

### 5.2 File Upload Component

Create `src/components/FileUpload.tsx`:

```tsx
import React, { useState } from "react";
import { PhotoBoothAPI } from "../services/api";

interface FileUploadProps {
  albumId: string;
  onUploadComplete?: (key: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  albumId,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Get presigned URL
        const presignResult = await PhotoBoothAPI.getPresignedUploadUrl(
          "album",
          {
            id: albumId,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }
        );

        if (!presignResult.success) {
          throw new Error(presignResult.error);
        }

        // Upload file
        await PhotoBoothAPI.uploadFile(
          presignResult.uploadUrl,
          file,
          (uploadProgress) => {
            const totalProgress =
              ((i + uploadProgress / 100) / files.length) * 100;
            setProgress(Math.round(totalProgress));
          }
        );

        if (onUploadComplete) {
          onUploadComplete(presignResult.key);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h3>Upload Photos</h3>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="file-input"
      />

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default FileUpload;
```

### 5.3 Order Status Component

Create `src/components/OrderStatus.tsx`:

```tsx
import React, { useState, useEffect } from "react";
import { PhotoBoothAPI } from "../services/api";

interface OrderStatusProps {
  orderId: string;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ orderId }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);

    const result = await PhotoBoothAPI.getOrder(orderId);

    if (result.success) {
      setOrder(result.order);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const updateStatus = async (
    status: "PROCESSING" | "COMPLETED" | "FAILED"
  ) => {
    const result = await PhotoBoothAPI.updateOrderStatus(orderId, status);

    if (result.success) {
      setOrder(result.order);
    } else {
      setError(result.error);
    }
  };

  if (loading) return <div>Loading order...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="order-status">
      <h3>Order Status</h3>

      <div className="order-info">
        <p>
          <strong>Order ID:</strong> {order.orderId}
        </p>
        <p>
          <strong>Customer:</strong> {order.customerId}
        </p>
        <p>
          <strong>Status:</strong>
          <span className={`status status-${order.status.toLowerCase()}`}>
            {order.status}
          </span>
        </p>
        <p>
          <strong>Total:</strong> ${order.totalPrice} {order.currency}
        </p>
        <p>
          <strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Updated:</strong> {new Date(order.updatedAt).toLocaleString()}
        </p>
      </div>

      {order.errorMessage && (
        <div className="error-message">
          <strong>Error:</strong> {order.errorMessage}
        </div>
      )}

      <div className="order-actions">
        {order.status === "PENDING" && (
          <button
            onClick={() => updateStatus("PROCESSING")}
            className="btn btn-warning"
          >
            Start Processing
          </button>
        )}

        {order.status === "PROCESSING" && (
          <button
            onClick={() => updateStatus("COMPLETED")}
            className="btn btn-success"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
```

## Step 6: Create Main App Component

Create `src/components/PhotoBoothApp.tsx`:

```tsx
import React, { useState } from "react";
import CreateOrder from "./CreateOrder";
import FileUpload from "./FileUpload";
import OrderStatus from "./OrderStatus";

const PhotoBoothApp: React.FC = () => {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [view, setView] = useState<"create" | "upload" | "status">("create");

  const handleOrderCreated = (order: any) => {
    setCurrentOrder(order);
    setView("upload");
  };

  const handleUploadComplete = () => {
    setView("status");
  };

  return (
    <div className="photo-booth-app">
      <header>
        <h1>Ape Moments Photo Booth</h1>
        <nav>
          <button
            onClick={() => setView("create")}
            className={view === "create" ? "active" : ""}
          >
            Create Order
          </button>
          {currentOrder && (
            <>
              <button
                onClick={() => setView("upload")}
                className={view === "upload" ? "active" : ""}
              >
                Upload Photos
              </button>
              <button
                onClick={() => setView("status")}
                className={view === "status" ? "active" : ""}
              >
                Order Status
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        {view === "create" && (
          <CreateOrder onOrderCreated={handleOrderCreated} />
        )}

        {view === "upload" && currentOrder && (
          <FileUpload
            albumId={`album-${currentOrder.orderId}`}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {view === "status" && currentOrder && (
          <OrderStatus orderId={currentOrder.orderId} />
        )}
      </main>
    </div>
  );
};

export default PhotoBoothApp;
```

## Step 7: Add Basic Styling

Create `src/styles/App.css`:

```css
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

/* Layout */
.photo-booth-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

header h1 {
  color: #2c3e50;
  margin-bottom: 15px;
}

nav {
  display: flex;
  gap: 10px;
}

nav button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

nav button:hover {
  background: #f8f9fa;
}

nav button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

main {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Components */
.create-order,
.file-upload,
.order-status {
  max-width: 600px;
  margin: 0 auto;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* File upload */
.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  cursor: pointer;
  margin-bottom: 20px;
}

.file-input:hover {
  border-color: #007bff;
}

/* Progress bar */
.upload-progress {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

/* Status indicators */
.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-processing {
  background: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
}

/* Error messages */
.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin: 10px 0;
  border: 1px solid #f5c6cb;
}

.error-message {
  background: #fff3cd;
  color: #856404;
  padding: 12px;
  border-radius: 4px;
  margin: 10px 0;
  border: 1px solid #ffeaa7;
}

/* Order info */
.order-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  margin: 20px 0;
}

.order-info p {
  margin-bottom: 8px;
}

.order-success {
  background: #d4edda;
  color: #155724;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #c3e6cb;
}

.order-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .photo-booth-app {
    padding: 10px;
  }

  nav {
    flex-direction: column;
  }

  nav button {
    width: 100%;
  }

  main {
    padding: 20px;
  }
}
```

## Step 8: Test Your Setup

### 8.1 Create Test Script

Create `src/test-api.ts`:

```typescript
import { PhotoBoothAPI } from "./services/api";

const testAPI = async () => {
  console.log("🧪 Testing Photo Booth API...");

  // Test 1: Create Order
  console.log("\n1. Testing order creation...");
  const orderResult = await PhotoBoothAPI.createOrder({
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
  });

  if (orderResult.success) {
    console.log("✅ Order created:", orderResult.order);

    // Test 2: Get Order
    console.log("\n2. Testing order retrieval...");
    const getResult = await PhotoBoothAPI.getOrder(orderResult.order.orderId);

    if (getResult.success) {
      console.log("✅ Order retrieved:", getResult.order);
    } else {
      console.log("❌ Failed to get order:", getResult.error);
    }

    // Test 3: Get Presigned URL
    console.log("\n3. Testing presigned URL generation...");
    const presignResult = await PhotoBoothAPI.getPresignedUploadUrl("album", {
      id: `album-${orderResult.order.orderId}`,
      fileName: "test.jpg",
      contentType: "image/jpeg",
      fileSize: 1024,
    });

    if (presignResult.success) {
      console.log("✅ Presigned URL generated:", presignResult.uploadUrl);
    } else {
      console.log("❌ Failed to get presigned URL:", presignResult.error);
    }
  } else {
    console.log("❌ Failed to create order:", orderResult.error);
  }

  console.log("\n🏁 API testing complete!");
};

// Run test
testAPI().catch(console.error);
```

### 8.2 Run Your App

```bash
# Start development server
npm start

# Or for Next.js
npm run dev
```

Visit `http://localhost:3000` and test the following:

1. **Create Order**: Click "Start Photo Session"
2. **Upload Photos**: Select image files
3. **Check Status**: View order details and status

## Step 9: Production Deployment

### 9.1 Environment Variables

Create `.env.production`:

```bash
REACT_APP_API_ENDPOINT=https://your-production-endpoint.appsync-api.us-east-1.amazonaws.com/graphql
REACT_APP_AWS_REGION=us-east-1
REACT_APP_MAX_FILE_SIZE=25165824
```

### 9.2 Build for Production

```bash
npm run build
```

### 9.3 Deploy Options

#### Option A: AWS Amplify Hosting

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Deploy to Amplify
amplify add hosting
amplify publish
```

#### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option C: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

## Step 10: Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: Browser blocks requests to your API
**Solution**: Ensure your frontend domain is added to CORS configuration in `backend.ts`

#### 2. Authentication Errors

**Problem**: API calls fail with auth errors
**Solution**: Check that `amplify_outputs.json` is properly configured

#### 3. File Upload Failures

**Problem**: Files fail to upload
**Solution**: Check file size limits and content type validation

#### 4. Network Errors

**Problem**: API calls timeout or fail
**Solution**: Check network connectivity and API endpoint URL

### Debug Mode

Add this to your app for debugging:

```typescript
// Enable debug mode
import { Amplify } from "aws-amplify";

if (process.env.NODE_ENV === "development") {
  Amplify.configure({
    ...outputs,
    API: {
      GraphQL: {
        ...outputs.API?.GraphQL,
        debug: true,
      },
    },
  });
}
```

## Step 11: Next Steps

### Enhancements to Consider

1. **Real-time Updates**: Use WebSockets or polling for order status updates
2. **Image Processing**: Add client-side image resizing/compression
3. **Progress Tracking**: Implement detailed upload progress
4. **Error Recovery**: Add retry logic for failed operations
5. **Offline Support**: Cache data for offline functionality
6. **Analytics**: Track user interactions and performance
7. **Testing**: Add unit and integration tests
8. **Accessibility**: Ensure WCAG compliance

### Additional Features

1. **Photo Gallery**: Display uploaded photos
2. **Order History**: Show past orders
3. **Print Integration**: Connect to print services
4. **Social Sharing**: Share photos on social media
5. **QR Code Generation**: Generate QR codes for orders

This completes your frontend setup! You now have a fully functional photo booth web application that can create orders, upload photos, and track order status using your AWS Amplify Gen 2 backend.
