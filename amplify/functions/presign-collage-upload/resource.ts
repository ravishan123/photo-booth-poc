import { defineFunction } from "@aws-amplify/backend";

export const presignCollageUpload = defineFunction({
  name: "presign-collage-upload",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  environment: {
    MAX_UPLOAD_MB: "10",
  },
});
