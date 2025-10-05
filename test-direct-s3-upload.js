#!/usr/bin/env node

/**
 * Direct S3 Upload Test - Alternative Solution
 *
 * This script shows how to upload files directly to S3 using the existing storage configuration.
 */

const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

// Load amplify outputs
const outputsPath = path.join(__dirname, "amplify_outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

console.log("🚀 Direct S3 Upload Test");
console.log("========================");
console.log("");

// Configure AWS SDK
AWS.config.update({
  region: outputs.storage.aws_region || "us-east-1",
});

// You'll need to configure your AWS credentials
// Option 1: Use AWS CLI configured credentials
// Option 2: Set environment variables
// Option 3: Use IAM roles if running on EC2

const s3 = new AWS.S3();

async function uploadToS3(type, uuid, filePath, fileName) {
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath);

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${type}s/${uuid}/${timestamp}_${sanitizedFileName}`;

    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "application/octet-stream";

    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".png") {
      contentType = "image/png";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    } else if (ext === ".gif") {
      contentType = "image/gif";
    }

    // Upload parameters
    const params = {
      Bucket: outputs.storage.bucket_name,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        originalName: fileName,
        uploadType: type,
        uuid: uuid,
        uploadedAt: new Date().toISOString(),
      },
    };

    console.log(`📤 Uploading ${fileName} to S3...`);
    console.log(`   Bucket: ${outputs.storage.bucket_name}`);
    console.log(`   Key: ${key}`);
    console.log(`   Content Type: ${contentType}`);
    console.log(`   File Size: ${fileContent.length} bytes`);

    const result = await s3.upload(params).promise();

    console.log("✅ Upload successful!");
    console.log(`   Location: ${result.Location}`);
    console.log(`   ETag: ${result.ETag}`);

    return {
      success: true,
      location: result.Location,
      key: key,
      etag: result.ETag,
    };
  } catch (error) {
    console.error("❌ Upload failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Example usage
async function main() {
  console.log("📋 Upload Examples:");
  console.log("");

  // Example 1: Upload a test file (create a dummy file if needed)
  const testFilePath = path.join(__dirname, "test-file.pdf");

  // Create a dummy PDF file for testing
  if (!fs.existsSync(testFilePath)) {
    console.log("📝 Creating dummy test file...");
    fs.writeFileSync(testFilePath, "This is a dummy PDF content for testing");
  }

  console.log("🧪 Test 1: Album PDF Upload");
  const result1 = await uploadToS3(
    "album",
    "550e8400-e29b-41d4-a716-446655440000",
    testFilePath,
    "test-album.pdf"
  );

  console.log("");
  console.log("🧪 Test 2: Collage PDF Upload");
  const result2 = await uploadToS3(
    "collage",
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    testFilePath,
    "test-collage.pdf"
  );

  console.log("");
  console.log("📊 Results:");
  console.log(
    `   Album Upload: ${result1.success ? "✅ Success" : "❌ Failed"}`
  );
  console.log(
    `   Collage Upload: ${result2.success ? "✅ Success" : "❌ Failed"}`
  );

  if (result1.success && result2.success) {
    console.log("");
    console.log("🎉 Both uploads successful!");
    console.log("💡 You can now use this approach in your frontend:");
    console.log("");
    console.log('   const AWS = require("aws-sdk");');
    console.log("   const s3 = new AWS.S3();");
    console.log("");
    console.log("   const params = {");
    console.log('     Bucket: "your-bucket-name",');
    console.log('     Key: "albums/uuid/timestamp_filename.pdf",');
    console.log("     Body: fileContent,");
    console.log('     ContentType: "application/pdf"');
    console.log("   };");
    console.log("");
    console.log("   await s3.upload(params).promise();");
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadToS3 };
