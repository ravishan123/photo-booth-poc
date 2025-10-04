import { defineFunction } from "@aws-amplify/backend";

export const presignPdfUpload = defineFunction({
  name: "presign-pdf-upload",
  entry: "./handler.ts",
});
