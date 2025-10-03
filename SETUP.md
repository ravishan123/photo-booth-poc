# Quick Setup Guide

Follow these steps to get your Amplify Gen 2 backend up and running.

## Prerequisites

1. **Node.js 20.x or later**

   ```bash
   node --version  # Should be v20.x or higher
   ```

2. **AWS CLI configured**

   ```bash
   aws --version
   aws configure list --profile apemoments
   ```

3. **AWS Account Access**
   - Ensure your IAM user has necessary permissions (see README)
   - Account should be CDK bootstrapped in your target region

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Check AWS Configuration

```bash
# Verify your AWS credentials
aws sts get-caller-identity --profile apemoments

# Check configured region
aws configure get region --profile apemoments
```

### 3. Bootstrap CDK (If Not Already Done)

```bash
# Check if bootstrapped
aws ssm get-parameter \
  --name /cdk-bootstrap/hnb659fds/version \
  --profile apemoments \
  --region us-west-2

# If not bootstrapped, run:
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2 --profile apemoments
```

Replace `YOUR_ACCOUNT_ID` with your AWS account ID from step 2.

### 4. Configure Environment (Optional)

```bash
cp .env.example .env
# Edit .env with your values
```

### 5. Start Sandbox

```bash
npm run sandbox
```

This will:

- Deploy all backend resources to AWS
- Watch for file changes
- Auto-redeploy on changes
- Generate `amplify_outputs.json`

**First deployment takes 5-10 minutes.** Subsequent deployments are faster.

### 6. Verify Deployment

Once deployed, you should see:

```
✅ Deployed successfully!
Sandbox URL: https://...appsync-api...amazonaws.com/graphql
```

The `amplify_outputs.json` file will be created in the project root.

### 7. Test the API

You can test the API using the Amplify console or directly:

```bash
# View the GraphQL API URL
cat amplify_outputs.json | grep graphql_endpoint
```

## Common Issues

### SSM Parameter Access Denied

**Error**: `User is not authorized to perform: ssm:GetParameter`

**Solution**:

1. Ensure CDK bootstrap is complete
2. Grant your IAM user SSM read permissions
3. See README for example IAM policy

### Function Deployment Fails

**Error**: Lambda function fails to deploy

**Solution**:

1. Check CloudWatch logs for the specific function
2. Verify all dependencies are listed in function's `package.json`
3. Run `npm run sandbox` again

### CORS Errors

**Error**: CORS policy blocking requests

**Solution**:

1. Update `FRONTEND_ORIGIN` in `amplify/backend.ts`
2. Add your frontend URL to `allowedOrigins` array
3. Redeploy: `npm run sandbox`

## Next Steps

1. **Update CORS origins** in `amplify/backend.ts` with your frontend URL
2. **Configure IAM permissions** for production (see README)
3. **Set up CI/CD** for production deployment
4. **Add monitoring** with CloudWatch alarms
5. **Implement authentication** flow with Cognito

## Useful Commands

```bash
# Start sandbox (interactive)
npm run sandbox

# Deploy once without watching
npm run sandbox:once

# Delete sandbox environment
npm run delete

# Deploy to production
npm run deploy

# Generate outputs only
npm run generate:outputs
```

## Troubleshooting

If you encounter issues:

1. Check the terminal output for specific errors
2. View CloudWatch logs in AWS Console
3. Verify IAM permissions
4. Ensure CDK bootstrap is complete
5. Try deleting and recreating sandbox: `npm run delete && npm run sandbox`

For more detailed information, see the main [README.md](./README.md).

## Support

- GitHub Issues: [Create an issue](https://github.com/ravishan123/photo-booth-poc/issues)
- AWS Amplify Docs: https://docs.amplify.aws/
- AWS Support: https://aws.amazon.com/support/
