import { defineFunction } from "@aws-amplify/backend";

export const getOrder = defineFunction({
  name: "get-order",
  entry: "./handler.ts",
  timeoutSeconds: 15,
});
