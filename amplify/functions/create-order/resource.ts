import { defineFunction } from "@aws-amplify/backend";

export const createOrder = defineFunction({
  name: "create-order",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  environment: {
    APP_ENV: process.env.APP_ENV || "development",
  },
});
