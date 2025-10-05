import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Ape Moments Photo Booth Schema
 *
 * Models:
 * - Order: Main order entity with status tracking
 * - Album: Album metadata
 * - Collage: Collage metadata
 */
const schema = a.schema({
  // Custom queries and mutations
  createOrderCustom: a
    .mutation()
    .arguments({
      input: a.json().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function("create-order")),

  getOrderDetails: a
    .query()
    .arguments({
      orderId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function("get-order")),

  updateOrderStatus: a
    .mutation()
    .arguments({
      orderId: a.string().required(),
      status: a.string().required(),
      errorMessage: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function("update-order-status")),

  listOrdersCustom: a
    .query()
    .arguments({
      customerEmail: a.string(),
      status: a.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
      type: a.enum(["album", "collage"]),
      limit: a.integer(),
      nextToken: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function("list-orders")),

  // presignUpload: a
  //   .mutation()
  //   .arguments({
  //     input: a.json().required(),
  //   })
  //   .returns(a.json())
  //   .authorization((allow) => [allow.publicApiKey()])
  //   .handler(a.handler.function("presign-upload")),

  processOrder: a
    .mutation()
    .arguments({
      orderId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function("process-order")),

  Order: a
    .model({
      customerEmail: a.string().required(),
      type: a.enum(["album", "collage"]),
      status: a.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
      totalPrice: a.float().required(),
      currency: a.string().default("USD"),
      paymentMethod: a.enum(["bank_transfer", "card_payment"]),
      imageCount: a.integer().required(),
      images: a.json().required(), // Base64 encoded images or URLs
      userDetails: a.json().required(), // Customer information
      specialNote: a.string(), // Optional frontend text area field
      metadata: a.json(), // Order metadata (orientation, pageCount, dimensions)
      errorMessage: a.string(),
      expiresAt: a.integer(), // Unix timestamp for TTL
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("customerEmail")
        .sortKeys(["createdAt"])
        .queryField("listOrdersByCustomer"),
      index("status").sortKeys(["createdAt"]).queryField("listOrdersByStatus"),
      index("type").sortKeys(["createdAt"]).queryField("listOrdersByType"),
    ])
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update"]),
    ]),

  Album: a
    .model({
      customerId: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      imageCount: a.integer().default(0),
      status: a.enum(["UPLOADING", "READY", "PROCESSING", "COMPLETED"]),
      pdfUrl: a.string(), // PDF URL
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("customerId")
        .sortKeys(["createdAt"])
        .queryField("listAlbumsByCustomer"),
    ])
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update"]),
    ]),

  Collage: a
    .model({
      customerId: a.string().required(),
      name: a.string().required(),
      template: a.string(), // Template type/layout
      sourceImages: a.json(), // Array of image references
      outputImageUrl: a.string(), // Final collage URL
      status: a.enum(["DRAFT", "PROCESSING", "COMPLETED", "FAILED"]),
      metadata: a.json(), // Additional configuration
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("customerId")
        .sortKeys(["createdAt"])
        .queryField("listCollagesByCustomer"),
    ])
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
