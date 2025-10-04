#!/bin/bash

# Test CreateOrderCustom mutation with a simple, short Base64 image

curl --location 'https://n243frnyuncvnnzw3tjcngpwh4.appsync-api.us-east-1.amazonaws.com/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: da2-e7jnjxawkzedlf4xeimfisrgvq' \
--data-raw '{
  "query": "mutation CreateOrderCustom($input: JSON!) { createOrderCustom(input: $input) }",
  "variables": {
    "input": {
      "type": "album",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "userDetails": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "address": "123 Main Street",
        "city": "New York",
        "postalCode": "10001",
        "specialInstructions": "Please handle with care"
      },
      "metadata": {
        "orientation": "portrait",
        "pageCount": 20,
        "dimensions": {
          "width": 8,
          "height": 10
        }
      }
    }
  }
}'

