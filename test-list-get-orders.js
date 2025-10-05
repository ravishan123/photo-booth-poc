#!/usr/bin/env node

/**
 * Test Script for List and Get Order APIs
 *
 * This script tests all available order query operations
 */

const https = require("https");

// Load configuration
const outputsPath = require("path").join(__dirname, "amplify_outputs.json");
const outputs = JSON.parse(require("fs").readFileSync(outputsPath, "utf8"));

const GRAPHQL_ENDPOINT = outputs.data.url;
const API_KEY = outputs.data.api_key;

console.log("🚀 Order List and Get API Test Script");
console.log("=====================================");
console.log(`Endpoint: ${GRAPHQL_ENDPOINT}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log("");

// Function to make GraphQL request
async function makeGraphQLRequest(query, variables = {}) {
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
          reject(error);
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

// Test cases
const testCases = [
  {
    name: "1. List All Orders",
    query: `
      query ListOrders($limit: Int, $nextToken: String) {
        listOrders(limit: $limit, nextToken: $nextToken) {
          items {
            id
            customerEmail
            type
            status
            totalPrice
            currency
            paymentMethod
            imageCount
            specialNote
            createdAt
            updatedAt
          }
          nextToken
        }
      }
    `,
    variables: { limit: 10 },
  },
  {
    name: "2. Get Order by ID (Direct Model)",
    query: `
      query GetOrder($id: ID!) {
        getOrder(id: $id) {
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
          specialNote
          metadata
          errorMessage
          expiresAt
          createdAt
          updatedAt
        }
      }
    `,
    variables: { id: "f0af3bd2-d701-48a4-8e9c-0ab30268b09b" }, // Replace with actual order ID
  },
  {
    name: "3. List Orders by Customer Email",
    query: `
      query ListOrdersByCustomer($customerEmail: String!, $limit: Int) {
        listOrdersByCustomer(customerEmail: $customerEmail, limit: $limit) {
          items {
            id
            customerEmail
            type
            status
            totalPrice
            paymentMethod
            specialNote
            createdAt
          }
          nextToken
        }
      }
    `,
    variables: {
      customerEmail: "john.doe@example.com",
      limit: 5,
    },
  },
  {
    name: "4. List Orders by Type (Album)",
    query: `
      query ListOrdersByType($type: OrderType!, $limit: Int) {
        listOrdersByType(type: $type, limit: $limit) {
          items {
            id
            customerEmail
            type
            status
            totalPrice
            paymentMethod
            specialNote
            createdAt
          }
          nextToken
        }
      }
    `,
    variables: {
      type: "album",
      limit: 5,
    },
  },
  {
    name: "5. List Orders by Type (Collage)",
    query: `
      query ListOrdersByType($type: OrderType!, $limit: Int) {
        listOrdersByType(type: $type, limit: $limit) {
          items {
            id
            customerEmail
            type
            status
            totalPrice
            paymentMethod
            specialNote
            createdAt
          }
          nextToken
        }
      }
    `,
    variables: {
      type: "collage",
      limit: 5,
    },
  },
  {
    name: "6. List Orders by Status (PENDING)",
    query: `
      query ListOrdersByStatus($status: OrderStatus!, $limit: Int) {
        listOrdersByStatus(status: $status, limit: $limit) {
          items {
            id
            customerEmail
            type
            status
            totalPrice
            paymentMethod
            specialNote
            createdAt
          }
          nextToken
        }
      }
    `,
    variables: {
      status: "PENDING",
      limit: 5,
    },
  },
  {
    name: "7. Get Order Details (Custom Function)",
    query: `
      query GetOrderDetails($orderId: String!) {
        getOrderDetails(orderId: $orderId)
      }
    `,
    variables: {
      orderId: "f0af3bd2-d701-48a4-8e9c-0ab30268b09b", // Replace with actual order ID
    },
  },
  {
    name: "8. List Orders Custom (Custom Function)",
    query: `
      query ListOrdersCustom($customerEmail: String, $status: ListOrdersCustomStatus, $type: ListOrdersCustomType, $limit: Int) {
        listOrdersCustom(customerEmail: $customerEmail, status: $status, type: $type, limit: $limit)
      }
    `,
    variables: {
      customerEmail: "john.doe@example.com",
      status: "PENDING",
      type: "album",
      limit: 5,
    },
  },
];

// Function to run test case
async function runTestCase(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log("Variables:", JSON.stringify(testCase.variables, null, 2));

  try {
    const result = await makeGraphQLRequest(testCase.query, testCase.variables);

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

    if (result.data) {
      console.log("✅ Test passed!");

      // Format the response nicely
      const data = result.data;
      const queryName = Object.keys(data)[0];
      const queryResult = data[queryName];

      if (
        queryName === "listOrders" ||
        queryName === "listOrdersByCustomer" ||
        queryName === "listOrdersByType" ||
        queryName === "listOrdersByStatus"
      ) {
        console.log(`📋 ${queryName} Results:`);
        console.log(
          `   Total Items: ${queryResult.items ? queryResult.items.length : 0}`
        );
        if (queryResult.nextToken) {
          console.log(`   Next Token: ${queryResult.nextToken}`);
        }

        if (queryResult.items && queryResult.items.length > 0) {
          console.log("   Orders:");
          queryResult.items.forEach((order, index) => {
            console.log(`   ${index + 1}. Order ID: ${order.id}`);
            console.log(`      Customer: ${order.customerEmail}`);
            console.log(`      Type: ${order.type}`);
            console.log(`      Status: ${order.status}`);
            console.log(`      Price: $${order.totalPrice} ${order.currency}`);
            console.log(`      Payment: ${order.paymentMethod}`);
            if (order.specialNote) {
              console.log(`      Special Note: ${order.specialNote}`);
            }
            console.log(`      Created: ${order.createdAt}`);
            console.log("");
          });
        } else {
          console.log("   No orders found");
        }
      } else if (queryName === "getOrder") {
        console.log("📋 Order Details:");
        if (queryResult) {
          console.log(`   Order ID: ${queryResult.id}`);
          console.log(`   Customer: ${queryResult.customerEmail}`);
          console.log(`   Type: ${queryResult.type}`);
          console.log(`   Status: ${queryResult.status}`);
          console.log(
            `   Price: $${queryResult.totalPrice} ${queryResult.currency}`
          );
          console.log(`   Payment: ${queryResult.paymentMethod}`);
          console.log(`   Image Count: ${queryResult.imageCount}`);
          if (queryResult.specialNote) {
            console.log(`   Special Note: ${queryResult.specialNote}`);
          }
          console.log(`   Created: ${queryResult.createdAt}`);
          console.log(`   Updated: ${queryResult.updatedAt}`);
        } else {
          console.log("   Order not found");
        }
      } else {
        console.log("📋 Response:", JSON.stringify(queryResult, null, 2));
      }

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
  console.log("🔍 Available Order Queries:");
  console.log("   - listOrders: List all orders with pagination");
  console.log("   - getOrder: Get specific order by ID");
  console.log("   - listOrdersByCustomer: List orders by customer email");
  console.log("   - listOrdersByType: List orders by type (album/collage)");
  console.log("   - listOrdersByStatus: List orders by status");
  console.log("   - getOrderDetails: Custom function to get order details");
  console.log(
    "   - listOrdersCustom: Custom function to list orders with filters"
  );
  console.log("");

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    const success = await runTestCase(testCase);
    if (success) passed++;
  }

  console.log("\n📊 Test Results:");
  console.log(`   Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.");
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeGraphQLRequest, runTestCase };
