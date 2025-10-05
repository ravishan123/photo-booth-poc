#!/usr/bin/env node

/**
 * Test Script for Photo Booth API - File Upload
 *
 * This script tests the presignUpload mutation for uploading files to S3.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Load amplify outputs
const outputsPath = path.join(__dirname, "amplify_outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const GRAPHQL_ENDPOINT = outputs.data.url;
const API_KEY = outputs.data.api_key;

console.log("🚀 Photo Booth API Test Script - File Upload");
console.log("=============================================");
console.log(`Endpoint: ${GRAPHQL_ENDPOINT}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log("");

// Test cases for file upload
const testCases = [
  {
    name: "Album PDF Upload",
    input: {
      type: "album",
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      fileName: "my-album.pdf",
      contentType: "application/pdf",
      fileSize: 2048000, // 2MB
    },
  },
  {
    name: "Album Image Upload (JPEG)",
    input: {
      type: "album",
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      fileName: "photo1.jpg",
      contentType: "image/jpeg",
      fileSize: 1024000, // 1MB
    },
  },
  {
    name: "Collage PDF Upload",
    input: {
      type: "collage",
      uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      fileName: "my-collage.pdf",
      contentType: "application/pdf",
      fileSize: 1536000, // 1.5MB
    },
  },
  {
    name: "Collage Image Upload (PNG)",
    input: {
      type: "collage",
      uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      fileName: "collage-image.png",
      contentType: "image/png",
      fileSize: 512000, // 512KB
    },
  },
];

// GraphQL mutation for presign upload
const PRESIGN_UPLOAD_MUTATION = `
  mutation PresignUpload($input: AWSJSON!) {
    presignUpload(input: $input)
  }
`;

// Function to make GraphQL request
async function makeGraphQLRequest(query, variables) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query,
      variables,
    });

    const options = {
      hostname: new URL(GRAPHQL_ENDPOINT).hostname,
      port: 443,
      path: new URL(GRAPHQL_ENDPOINT).pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "x-api-key": API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to run test case
async function runTestCase(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log("Input:", JSON.stringify(testCase.input, null, 2));

  try {
    const variables = {
      input: JSON.stringify(testCase.input),
    };

    const result = await makeGraphQLRequest(PRESIGN_UPLOAD_MUTATION, variables);

    console.log("Response:", JSON.stringify(result, null, 2));

    if (result.errors) {
      console.log("❌ Test failed with errors:");
      result.errors.forEach((error) => {
        console.log(`   - ${error.message}`);
        if (error.path) {
          console.log(`     Path: ${error.path.join(".")}`);
        }
      });
      return false;
    }

    if (result.data && result.data.presignUpload) {
      const uploadData = JSON.parse(result.data.presignUpload);
      console.log("✅ Test passed!");
      console.log("Upload details:");
      console.log(
        `   - Upload URL: ${uploadData.uploadUrl.substring(0, 50)}...`
      );
      console.log(`   - S3 Key: ${uploadData.key}`);
      console.log(`   - Expires In: ${uploadData.expiresIn} seconds`);
      console.log(
        `   - Max File Size: ${uploadData.maxFileSize / (1024 * 1024)}MB`
      );
      console.log(`   - Allowed Types: ${uploadData.allowedTypes.join(", ")}`);
      return true;
    } else {
      console.log("❌ Test failed: No data returned");
      return false;
    }
  } catch (error) {
    console.log("❌ Test failed with exception:", error.message);
    return false;
  }
}

// Function to test validation
async function testValidation() {
  console.log("\n🔍 Testing Upload Validation...");

  const validationTests = [
    {
      name: "Invalid Type Test",
      input: {
        type: "invalid",
        uuid: "test-uuid",
        fileName: "test.pdf",
        contentType: "application/pdf",
        fileSize: 1000000,
      },
      shouldFail: true,
    },
    {
      name: "Invalid Content Type Test",
      input: {
        type: "album",
        uuid: "test-uuid",
        fileName: "test.txt",
        contentType: "text/plain",
        fileSize: 1000000,
      },
      shouldFail: true,
    },
    {
      name: "File Too Large Test",
      input: {
        type: "album",
        uuid: "test-uuid",
        fileName: "huge-file.pdf",
        contentType: "application/pdf",
        fileSize: 100 * 1024 * 1024, // 100MB
      },
      shouldFail: true,
    },
  ];

  let passedTests = 0;
  let totalTests = validationTests.length;

  for (const test of validationTests) {
    console.log(`\n🧪 Running: ${test.name}`);

    const variables = {
      input: JSON.stringify(test.input),
    };

    try {
      const result = await makeGraphQLRequest(
        PRESIGN_UPLOAD_MUTATION,
        variables
      );

      const hasErrors = result.errors && result.errors.length > 0;

      if (test.shouldFail && hasErrors) {
        console.log("✅ Validation working correctly - invalid input rejected");
        passedTests++;
      } else if (!test.shouldFail && !hasErrors) {
        console.log("✅ Test passed - valid input accepted");
        passedTests++;
      } else {
        console.log("❌ Validation failed - unexpected result");
        if (hasErrors) {
          console.log("   Errors:", result.errors);
        }
      }
    } catch (error) {
      console.log("❌ Test failed with exception:", error.message);
    }
  }

  return { passed: passedTests, total: totalTests };
}

// Main function
async function main() {
  try {
    // Run upload test cases
    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      const passed = await runTestCase(testCase);
      if (passed) passedTests++;
    }

    // Run validation tests
    const validationResults = await testValidation();
    passedTests += validationResults.passed;
    totalTests += validationResults.total;

    console.log("\n📊 Test Results:");
    console.log(`   Passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log("🎉 All tests passed!");
      console.log("\n📁 Upload Features:");
      console.log("   - Unified endpoint for albums and collages");
      console.log("   - Supports PDF and image files");
      console.log("   - Automatic file type validation");
      console.log("   - File size limits (50MB max)");
      console.log("   - Secure presigned URLs (1 hour expiry)");
      console.log(
        "   - Organized S3 structure (albums/{uuid}/, collages/{uuid}/)"
      );
    } else {
      console.log("⚠️  Some tests failed. Check the errors above.");
    }
  } catch (error) {
    console.error("💥 Script failed:", error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { makeGraphQLRequest, runTestCase };
