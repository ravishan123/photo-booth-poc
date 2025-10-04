#!/usr/bin/env node

/**
 * Test Script for Photo Booth API
 *
 * This script tests the createOrderCustom mutation and helps diagnose issues.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Load amplify outputs
const outputsPath = path.join(__dirname, "amplify_outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const GRAPHQL_ENDPOINT = outputs.data.url;
const API_KEY = outputs.data.api_key;

console.log("🚀 Photo Booth API Test Script");
console.log("================================");
console.log(`Endpoint: ${GRAPHQL_ENDPOINT}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log("");

// Test cases
const testCases = [
  {
    name: "Album Order Test",
    input: {
      type: "album",
      images: "550e8400-e29b-41d4-a716-446655440000",
      userDetails: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        address: "123 Main Street",
        city: "New York",
        postalCode: "10001",
        specialInstructions: "Please handle with care",
      },
    },
  },
  {
    name: "Collage Order Test",
    input: {
      type: "collage",
      images: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      userDetails: {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1987654321",
        address: "456 Oak Avenue",
        city: "Los Angeles",
        postalCode: "90210",
      },
    },
  },
];

// GraphQL query
const CREATE_ORDER_MUTATION = `
  mutation CreateOrderCustom($input: AWSJSON!) {
    createOrderCustom(input: $input)
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

// Function to test introspection
async function testIntrospection() {
  console.log("🔍 Testing GraphQL Introspection...");

  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        mutationType {
          fields {
            name
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await makeGraphQLRequest(introspectionQuery, {});

    if (result.errors) {
      console.log("❌ Introspection failed:", result.errors);
      return false;
    }

    const mutations = result.data.__schema.mutationType.fields;
    console.log("✅ Available mutations:");
    mutations.forEach((mutation) => {
      console.log(`   - ${mutation.name}`);
      if (mutation.name === "createOrderCustom") {
        console.log(
          `     Args: ${mutation.args.map((arg) => `${arg.name}: ${arg.type.name || arg.type.kind}`).join(", ")}`
        );
      }
    });

    const createOrderExists = mutations.some(
      (m) => m.name === "createOrderCustom"
    );
    if (!createOrderExists) {
      console.log("❌ createOrderCustom mutation not found!");
      return false;
    }

    return true;
  } catch (error) {
    console.log("❌ Introspection error:", error.message);
    return false;
  }
}

// Function to run test case
async function runTestCase(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log("Input:", JSON.stringify(testCase.input, null, 2));

  try {
    const variables = {
      input: JSON.stringify(testCase.input),
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

    if (result.data && result.data.createOrderCustom) {
      const orderData = JSON.parse(result.data.createOrderCustom);
      console.log("✅ Test passed!");
      console.log("Order created:");
      console.log(`   - Order ID: ${orderData.orderId}`);
      console.log(`   - Type: ${orderData.type}`);
      console.log(`   - Status: ${orderData.status}`);
      console.log(
        `   - Total Price: $${orderData.totalPrice} ${orderData.currency}`
      );
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

// Main function
async function main() {
  try {
    // Test introspection first
    const introspectionPassed = await testIntrospection();

    if (!introspectionPassed) {
      console.log("\n❌ Introspection failed. Please check your deployment.");
      process.exit(1);
    }

    // Run test cases
    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      const passed = await runTestCase(testCase);
      if (passed) passedTests++;
    }

    console.log("\n📊 Test Results:");
    console.log(`   Passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log("🎉 All tests passed!");
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

module.exports = { makeGraphQLRequest, testIntrospection, runTestCase };
