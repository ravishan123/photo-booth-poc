import { defineFunction } from "@aws-amplify/backend";

export const updateOrderStatus = defineFunction({
  name: "update-order-status",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
