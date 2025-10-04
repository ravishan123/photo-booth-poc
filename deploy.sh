#!/bin/bash

echo "🚀 Deploying Photo Booth Backend..."
echo "=================================="

# Kill any existing sandbox processes
echo "🔄 Cleaning up existing processes..."
pkill -f "ampx sandbox" || true
sleep 2

# Deploy the backend
echo "📦 Deploying backend..."
npx ampx sandbox --once --profile apemoments

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🧪 Testing API..."
node test-api.js
