#!/usr/bin/env node

/**
 * Test Script for Photo Booth API - Payment Methods
 *
 * This script tests the Order model with different payment methods.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Load amplify outputs
const outputsPath = path.join(__dirname, "amplify_outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const GRAPHQL_ENDPOINT = outputs.data.url;
const API_KEY = outputs.data.api_key;

console.log("🚀 Photo Booth API Test Script - Payment Methods");
console.log("================================================");
console.log(`Endpoint: ${GRAPHQL_ENDPOINT}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log("");

// Test cases with different payment methods
const testCases = [
  {
    name: "Album Order - Card Payment",
    input: {
      customerEmail: "john.doe@example.com",
      type: "album",
      status: "PENDING",
      totalPrice: 5.0,
      currency: "USD",
      paymentMethod: "card_payment",
      imageCount: 1,
      images: JSON.stringify(["550e8400-e29b-41d4-a716-446655440000"]),
      userDetails: JSON.stringify({
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        address: "123 Main Street",
        city: "New York",
        postalCode: "10001",
        specialInstructions: "Please handle with care",
      }),
    },
  },
  {
    name: "Album Order - Bank Transfer",
    input: {
      customerEmail: "jane.smith@example.com",
      type: "album",
      status: "PENDING",
      totalPrice: 5.0,
      currency: "USD",
      paymentMethod: "bank_transfer",
      imageCount: 1,
      images: JSON.stringify(["6ba7b810-9dad-11d1-80b4-00c04fd430c8"]),
      userDetails: JSON.stringify({
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1987654321",
        address: "456 Oak Avenue",
        city: "Los Angeles",
        postalCode: "90210",
      }),
    },
  },
  {
    name: "Collage Order - Card Payment",
    input: {
      customerEmail: "bob.johnson@example.com",
      type: "collage",
      status: "PENDING",
      totalPrice: 3.0,
      currency: "USD",
      paymentMethod: "card_payment",
      imageCount: 1,
      images: JSON.stringify(["123e4567-e89b-12d3-a456-426614174000"]),
      userDetails: JSON.stringify({
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        phone: "+1555123456",
        address: "789 Pine Street",
        city: "Chicago",
        postalCode: "60601",
      }),
    },
  },
  {
    name: "Collage Order - Bank Transfer",
    input: {
      customerEmail: "alice.brown@example.com",
      type: "collage",
      status: "PENDING",
      totalPrice: 3.0,
      currency: "USD",
      paymentMethod: "bank_transfer",
      imageCount: 1,
      images: JSON.stringify(["987fcdeb-51a2-43d7-8f9e-123456789abc"]),
      userDetails: JSON.stringify({
        name: "Alice Brown",
        email: "alice.brown@example.com",
        phone: "+1444555666",
        address: "321 Elm Street",
        city: "Boston",
        postalCode: "02101",
        specialInstructions: "Rush order needed",
      }),
    },
  },
];

// GraphQL mutation for direct model
const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      customerEmail
      type
      status
      totalPrice
      currency
      paymentMethod
      imageCount
      images
      userDetails
      metadata
      errorMessage
      expiresAt
      createdAt
      updatedAt
    }
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
      input: testCase.input,
    };

    const result = await makeGraphQLRequest(CREATE_ORDER_MUTATION, variables);

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

    if (result.data && result.data.createOrder) {
      const orderData = result.data.createOrder;
      console.log("✅ Test passed!");
      console.log("Order created:");
      console.log(`   - Order ID: ${orderData.id}`);
      console.log(`   - Type: ${orderData.type}`);
      console.log(`   - Status: ${orderData.status}`);
      console.log(
        `   - Total Price: $${orderData.totalPrice} ${orderData.currency}`
      );
      console.log(`   - Payment Method: ${orderData.paymentMethod}`);
      console.log(`   - Customer Email: ${orderData.customerEmail}`);
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

// Function to test payment method validation
async function testPaymentMethodValidation() {
  console.log("\n🔍 Testing Payment Method Validation...");

  // Test invalid payment method
  const invalidTest = {
    name: "Invalid Payment Method Test",
    input: {
      customerEmail: "test@example.com",
      type: "album",
      status: "PENDING",
      totalPrice: 5.0,
      currency: "USD",
      paymentMethod: "invalid_payment", // This should fail
      imageCount: 1,
      images: JSON.stringify(["test-uuid"]),
      userDetails: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        address: "123 Test St",
        city: "Test City",
        postalCode: "12345",
      }),
    },
  };

  const result = await runTestCase(invalidTest);
  if (!result) {
    console.log(
      "✅ Validation working correctly - invalid payment method rejected"
    );
    return true;
  } else {
    console.log("❌ Validation failed - invalid payment method was accepted");
    return false;
  }
}

// Main function
async function main() {
  try {
    // Run test cases
    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      const passed = await runTestCase(testCase);
      if (passed) passedTests++;
    }

    // Test validation
    const validationPassed = await testPaymentMethodValidation();
    if (validationPassed) passedTests++;

    console.log("\n📊 Test Results:");
    console.log(`   Passed: ${passedTests}/${totalTests + 1}`);

    if (passedTests === totalTests + 1) {
      console.log("🎉 All tests passed!");
      console.log("\n💳 Payment Methods Supported:");
      console.log("   - card_payment: Credit/Debit card payments");
      console.log("   - bank_transfer: Bank transfer payments");
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
