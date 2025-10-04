import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface PresignPdfUploadInput {
  type: "album" | "collage";
  customerEmail: string;
}

export const handler = async (event: any) => {
  try {
    const input: PresignPdfUploadInput = event.arguments.input;

    // Generate UUID for the PDF
    const pdfUuid = uuidv4();

    // Determine S3 key based on type
    const s3Key = `${input.type}s/${pdfUuid}.pdf`;

    // Create presigned URL for PDF upload
    const command = new PutObjectCommand({
      Bucket:
        process.env.S3_BUCKET_NAME ||
        "amplify-photoboothpoc-rav-apemomentsbucket48846c25-zvazfqp1pwbt",
      Key: s3Key,
      ContentType: "application/pdf",
      Metadata: {
        customerEmail: input.customerEmail,
        type: input.type,
        uploadDate: new Date().toISOString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      statusCode: 200,
      body: {
        pdfUuid: pdfUuid,
        uploadUrl: presignedUrl,
        s3Key: s3Key,
        expiresIn: 3600,
        message: "PDF upload URL generated successfully",
      },
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return {
      statusCode: 500,
      body: {
        message: "Failed to generate presigned URL",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
};
