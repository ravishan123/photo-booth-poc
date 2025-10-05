// @ts-ignore
const AWS = require("aws-sdk");

// Configure S3 client (AWS SDK v2)
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "us-east-1",
});

interface PresignUploadInput {
  type: "album" | "collage";
  uuid: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

interface PresignUploadResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  maxFileSize: number;
  allowedTypes: string[];
}

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed content types
const ALLOWED_TYPES = {
  album: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  collage: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
};

export const handler = async (event: any) => {
  try {
    console.log("Presign upload request:", JSON.stringify(event, null, 2));

    const input: PresignUploadInput = event.arguments.input;

    // Validate input
    if (!input.type || !["album", "collage"].includes(input.type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid type. Must be 'album' or 'collage'",
          code: "INVALID_TYPE",
        }),
      };
    }

    if (
      !input.uuid ||
      typeof input.uuid !== "string" ||
      input.uuid.trim() === ""
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "UUID is required",
          code: "MISSING_UUID",
        }),
      };
    }

    if (!input.fileName || typeof input.fileName !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "File name is required",
          code: "MISSING_FILE_NAME",
        }),
      };
    }

    if (!input.contentType || typeof input.contentType !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Content type is required",
          code: "MISSING_CONTENT_TYPE",
        }),
      };
    }

    // Validate content type
    const allowedTypes = ALLOWED_TYPES[input.type];
    if (!allowedTypes.includes(input.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid content type. Allowed types for ${input.type}: ${allowedTypes.join(", ")}`,
          code: "INVALID_CONTENT_TYPE",
          allowedTypes,
        }),
      };
    }

    // Validate file size
    if (input.fileSize && input.fileSize > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          code: "FILE_TOO_LARGE",
          maxFileSize: MAX_FILE_SIZE,
        }),
      };
    }

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${input.type}s/${input.uuid}/${timestamp}_${sanitizedFileName}`;

    // Create presigned URL using AWS SDK v2
    const params = {
      Bucket: process.env.AMPLIFY_STORAGE_BUCKET_NAME!,
      Key: key,
      ContentType: input.contentType,
      Metadata: {
        originalName: input.fileName,
        uploadType: input.type,
        uuid: input.uuid,
        uploadedAt: new Date().toISOString(),
      },
      Expires: 3600, // 1 hour
    };

    const uploadUrl = s3.getSignedUrl("putObject", params);

    const response: PresignUploadResponse = {
      uploadUrl,
      key,
      expiresIn: 3600,
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes,
    };

    console.log("Generated presigned URL for:", key);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    };
  }
};
