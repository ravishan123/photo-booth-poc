const AWS = require("aws-sdk");

// Configure S3 client
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "us-east-1",
});

exports.handler = async (event) => {
  try {
    console.log("Presign upload request:", JSON.stringify(event, null, 2));

    const input = event.arguments.input;

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
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(input.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
          code: "INVALID_CONTENT_TYPE",
          allowedTypes,
        }),
      };
    }

    // Validate file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
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

    // Create presigned URL
    const params = {
      Bucket: process.env.AMPLIFY_STORAGE_BUCKET_NAME,
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

    const response = {
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
