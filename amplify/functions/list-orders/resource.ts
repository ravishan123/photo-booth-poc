import { defineFunction } from "@aws-amplify/backend";

export const listOrders = defineFunction({
  name: "list-orders",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
