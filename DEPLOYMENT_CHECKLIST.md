# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### 1. Environment Configuration

- [ ] Update CORS origins in `amplify/backend.ts` with production frontend URL
- [ ] Review and adjust file size limits in presign functions
- [ ] Set appropriate Lambda timeout values
- [ ] Configure environment variables in `.env` (if needed)

### 2. Security Review

- [ ] Verify IAM policies follow least-privilege principle
- [ ] Ensure all endpoints have proper authorization rules
- [ ] Confirm S3 bucket blocks all public access
- [ ] Review Cognito user pool configuration
- [ ] Enable MFA for production Cognito users (future)
- [ ] Rotate any hardcoded credentials or API keys

### 3. Data Layer

- [ ] Review DynamoDB table indexes (GSIs)
- [ ] Configure DynamoDB point-in-time recovery
- [ ] Set up DynamoDB auto-scaling or on-demand capacity
- [ ] Enable DynamoDB encryption at rest
- [ ] Configure TTL for Order.expiresAt field

### 4. Storage

- [ ] Enable S3 versioning (already configured)
- [ ] Configure S3 lifecycle policies (already configured)
- [ ] Review S3 CORS configuration
- [ ] Enable S3 server access logging
- [ ] Consider CloudFront CDN for static assets

### 5. Functions

- [ ] Review Lambda memory allocation
- [ ] Configure Lambda reserved concurrency (if needed)
- [ ] Enable X-Ray tracing for debugging
- [ ] Set up CloudWatch log retention periods
- [ ] Review error handling in all functions

### 6. Monitoring & Alerts

- [ ] Set up CloudWatch dashboards
- [ ] Configure CloudWatch alarms for:
  - Lambda errors > threshold
  - DynamoDB throttling
  - S3 4xx/5xx errors
  - API Gateway 5xx errors
- [ ] Set up SNS topics for alerts
- [ ] Configure log aggregation

### 7. Cost Management

- [ ] Enable AWS Cost Explorer
- [ ] Set up billing alerts
- [ ] Review DynamoDB capacity mode
- [ ] Configure S3 lifecycle transitions
- [ ] Review Lambda execution time optimization

## Deployment Steps

### First-Time Production Deployment

1. **Bootstrap CDK** (if not done):

   ```bash
   npx cdk bootstrap aws://ACCOUNT_ID/REGION --profile production
   ```

2. **Update AWS Profile**:
   Update `package.json` scripts to use production profile

3. **Deploy Backend**:

   ```bash
   npm run deploy -- --branch main
   ```

4. **Verify Deployment**:

   ```bash
   aws cloudformation describe-stacks --profile production
   ```

5. **Test Endpoints**:
   Use the generated `amplify_outputs.json` to test all endpoints

6. **Configure Frontend**:
   Copy `amplify_outputs.json` to frontend application

### Subsequent Deployments

1. **Review Changes**:

   ```bash
   git diff main
   ```

2. **Test in Sandbox**:

   ```bash
   npm run sandbox:once
   ```

3. **Deploy to Staging** (if available):

   ```bash
   npm run deploy -- --branch staging
   ```

4. **Run Integration Tests**:
   Test critical user flows

5. **Deploy to Production**:

   ```bash
   npm run deploy -- --branch main
   ```

6. **Smoke Test Production**:
   Test core functionality immediately after deployment

## Post-Deployment

### Verification

- [ ] Test GraphQL API endpoints
- [ ] Verify authentication flows
- [ ] Test file upload to S3
- [ ] Verify DynamoDB writes
- [ ] Check CloudWatch logs for errors
- [ ] Test order creation and status updates
- [ ] Verify presigned URL generation
- [ ] Test pagination and GSI queries

### Documentation

- [ ] Update API documentation
- [ ] Document any configuration changes
- [ ] Update runbooks with new procedures
- [ ] Record deployment date and version

### Communication

- [ ] Notify team of deployment
- [ ] Share any breaking changes
- [ ] Update changelog
- [ ] Post deployment notes

## Rollback Plan

If issues occur after deployment:

1. **Identify the Issue**:
   - Check CloudWatch logs
   - Review recent changes
   - Test specific endpoints

2. **Quick Rollback**:

   ```bash
   # Amplify Gen 2 doesn't support direct rollback
   # Revert code changes and redeploy
   git revert <commit-hash>
   npm run deploy
   ```

3. **Data Rollback** (if needed):
   - Use DynamoDB point-in-time recovery
   - Restore S3 object versions
   - Document data changes

4. **Communication**:
   - Notify affected users
   - Update status page
   - Document root cause

## Production Readiness Checklist

### Security ✅

- [ ] All data encrypted at rest and in transit
- [ ] IAM policies follow least privilege
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Reliability ✅

- [ ] Error handling in all functions
- [ ] Graceful degradation
- [ ] Retry logic for transient failures
- [ ] Circuit breakers (if applicable)
- [ ] Health checks configured

### Performance ✅

- [ ] Lambda cold start optimization
- [ ] DynamoDB query patterns optimized
- [ ] S3 performance optimization
- [ ] API response time < 200ms (target)
- [ ] File upload performance tested

### Observability ✅

- [ ] CloudWatch logging enabled
- [ ] Structured logging implemented
- [ ] Metrics and alarms configured
- [ ] Distributed tracing (X-Ray) enabled
- [ ] Error tracking configured

### Cost ✅

- [ ] DynamoDB capacity mode appropriate
- [ ] S3 lifecycle policies configured
- [ ] Lambda memory right-sized
- [ ] Unused resources cleaned up
- [ ] Cost alerts configured

### Documentation ✅

- [ ] README up to date
- [ ] Architecture documented
- [ ] API documentation complete
- [ ] Runbooks created
- [ ] Deployment guide available

## Emergency Contacts

- **AWS Support**: [Support URL]
- **On-Call Engineer**: [Contact]
- **Team Lead**: [Contact]
- **DevOps**: [Contact]

## Useful Commands

```bash
# Check deployment status
aws cloudformation describe-stacks --stack-name <stack-name>

# View function logs
aws logs tail /aws/lambda/<function-name> --follow

# Check DynamoDB table
aws dynamodb describe-table --table-name <table-name>

# List S3 bucket contents
aws s3 ls s3://bucket-name/

# Test GraphQL endpoint
curl -X POST <api-endpoint> \
  -H "x-api-key: <key>" \
  -d '{"query": "query { ... }"}'
```

## Sign-off

- [ ] Tech Lead Approval: ********\_******** Date: **\_\_\_**
- [ ] Security Review: ********\_\_******** Date: **\_\_\_**
- [ ] DevOps Review: ********\_\_\_******** Date: **\_\_\_**
- [ ] QA Sign-off: **********\_********** Date: **\_\_\_**

---

**Deployment Date**: ********\_********  
**Deployed By**: ********\_********  
**Version/Commit**: ********\_********  
**Notes**: ********\_********
