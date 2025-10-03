import { defineFunction } from "@aws-amplify/backend";

export const presignAlbumUpload = defineFunction({
  name: "presign-album-upload",
  entry: "./handler.ts",
  timeoutSeconds: 15,
  environment: {
    MAX_UPLOAD_MB: "10",
  },
});
