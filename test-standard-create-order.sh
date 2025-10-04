#!/bin/bash

# Test standard createOrder mutation (complex input)
# Note: This requires manual JSON stringification and data preparation

curl --location 'https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq' \
--data-raw '{
  "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id customerEmail type status totalPrice currency imageCount images userDetails metadata errorMessage expiresAt createdAt updatedAt } }",
  "variables": {
    "input": {
      "customerEmail": "john.doe@example.com",
      "type": "album",
      "status": "PENDING",
      "totalPrice": 25.00,
      "currency": "USD",
      "imageCount": 1,
      "images": "[\"data:image/jpeg;base64,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\"]",
      "userDetails": "{\"name\":\"John Doe\",\"email\":\"john.doe@example.com\",\"phone\":\"+1234567890\",\"address\":\"123 Main Street\",\"city\":\"New York\",\"postalCode\":\"10001\",\"specialInstructions\":\"Provided by customer\"}",
      "metadata": "{\"orientation\":\"portrait\",\"pageCount\":1,\"dimensions\":{\"width\":8,\"height\":10},\"paperType\":\"glossy\",\"binding\":\"spiral\"}"
    }
  }
}'
