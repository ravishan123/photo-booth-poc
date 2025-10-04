#!/bin/bash

# Test PDF Upload Flow
# Step 1: Get presigned URL for PDF upload
echo "Step 1: Getting presigned URL for PDF upload..."

curl --location 'https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq' \
--data-raw '{
  "query": "mutation PresignPdfUpload($input: JSON!) { presignPdfUpload(input: $input) }",
  "variables": {
    "input": {
      "type": "album",
      "customerEmail": "test@example.com"
    }
  }
}'

echo -e "\n\nStep 2: Use the returned pdfUuid and uploadUrl to upload your PDF to S3"
echo "Step 3: Then create order with the pdfUuid..."

# Step 3: Create order with PDF UUID
echo -e "\nStep 3: Creating order with PDF UUID..."

curl --location 'https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq' \
--data-raw '{
  "query": "mutation CreateOrderCustom($input: JSON!) { createOrderCustom(input: $input) }",
  "variables": {
    "input": {
      "type": "album",
      "pdfUuid": "REPLACE_WITH_ACTUAL_UUID_FROM_STEP_1",
      "customerEmail": "test@example.com",
      "phone": "+1234567890",
      "totalPrice": 25.00,
      "address": "123 Main Street",
      "city": "New York",
      "postalCode": "10001",
      "name": "Test User"
    }
  }
}'
