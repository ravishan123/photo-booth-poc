import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Schema } from "../../data/resource";
// @ts-ignore - Amplify Gen 2 runtime environment
import { env } from "$amplify/env/presign-album-upload";

const s3Client = new S3Client({ region: env.AWS_REGION });

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_MB = parseInt(env.MAX_UPLOAD_MB || "10", 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface PresignAlbumUploadInput {
  albumId: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
}

export const handler: Schema["presignAlbumUpload"]["functionHandler"] = async (
  event
) => {
  try {
    const input: PresignAlbumUploadInput = event.arguments
      .input as PresignAlbumUploadInput;
    const { albumId, fileName, contentType, fileSize } = input;

    // Validation
    if (!albumId || !fileName || !contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "albumId, fileName, and contentType are required",
          code: "VALIDATION_ERROR",
        }),
      };
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Content type ${contentType} is not allowed`,
          code: "INVALID_CONTENT_TYPE",
          allowedTypes: ALLOWED_CONTENT_TYPES,
        }),
      };
    }

    if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
          code: "FILE_TOO_LARGE",
        }),
      };
    }

    // Sanitize file name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const s3Key = `albums/${albumId}/${timestamp}-${sanitizedFileName}`;

    // Get bucket name from environment
    const bucketName = env.AMPLIFY_STORAGE_BUCKET_NAME;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: contentType,
      ...(fileSize && { ContentLength: fileSize }),
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        key: s3Key,
        bucket: bucketName,
        expiresIn: 3600,
      }),
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to generate presigned URL",
        code: "PRESIGN_ERROR",
      }),
    };
  }
};
