import { defineFunction } from "@aws-amplify/backend";

export const processOrder = defineFunction({
  name: "process-order",
  entry: "./handler.ts",
  timeoutSeconds: 60,
});
