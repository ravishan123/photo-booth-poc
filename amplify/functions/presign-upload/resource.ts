import { defineFunction } from "@aws-amplify/backend";

export const presignUpload = defineFunction({
  name: "presign-upload",
  entry: "./handler.js",
  timeoutSeconds: 30,
  environment: {
    APP_ENV: process.env.APP_ENV || "development",
  },
});
