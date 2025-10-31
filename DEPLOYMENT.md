# Deployment Guide

This application uses **SST (Serverless Stack)** for AWS deployment with Infrastructure as Code.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              CloudFront CDN                         │
│         (React Static Site)                         │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│           Lambda Function (API)                     │
│         NestJS Application                          │
│         Runtime: Node.js 20                         │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│        Aurora Serverless PostgreSQL                 │
│        (Auto-scaling Database)                      │
└─────────────────────────────────────────────────────┘

Secrets Manager: OpenAI API Key
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js 20+**
4. **SST CLI** (installed via npm)

## Setup AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity
```

## Installation

```bash
# Install dependencies
npm run install:all

# This installs SST in the root package.json
```

## Deployment Steps

### 1. Set OpenAI API Key in AWS Secrets Manager

```bash
# Create the secret (first time only)
aws secretsmanager create-secret \
  --name OpenAIApiKey \
  --secret-string "your-openai-api-key" \
  --region us-east-1

# Or update existing secret
aws secretsmanager update-secret \
  --secret-id OpenAIApiKey \
  --secret-string "your-openai-api-key" \
  --region us-east-1
```

### 2. Deploy to Development

```bash
# Deploy to dev stage
npm run deploy:dev

# This will:
# - Create Aurora Serverless PostgreSQL database
# - Deploy Lambda function with NestJS API
# - Deploy React frontend to S3 + CloudFront
# - Set up all IAM roles and permissions
```

**Output:**
```
✓ Complete
   API: https://abc123.lambda-url.us-east-1.on.aws
   Frontend: https://d1234567890abc.cloudfront.net
   Database: pharmacy-chatbot-dev.cluster-xyz.us-east-1.rds.amazonaws.com
```

### 3. Run Database Migrations

After first deployment, run migrations:

```bash
# Use SST shell to access the Lambda environment
npx sst shell

# Inside SST shell
cd backend
npm run migration:up
exit
```

### 4. Test the Deployment

```bash
# Test API endpoint
curl https://abc123.lambda-url.us-east-1.on.aws/api/chatbot/start \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1-555-123-4567"}'

# Open frontend in browser
open https://d1234567890abc.cloudfront.net
```

### 5. Deploy to Production

```bash
# Deploy to production stage
npm run deploy

# This creates a separate production stack with:
# - Production database (higher capacity)
# - Production Lambda (optimized settings)
# - Production CloudFront distribution
```

## SST Configuration Details

The `sst.config.ts` file defines:

### Database (Aurora Serverless PostgreSQL)
- **Scaling**: 0.5 - 4 ACU (adjusts automatically based on load)
- **Engine**: PostgreSQL compatible
- **Multi-AZ**: Automatic high availability
- **Backups**: Automated with point-in-time recovery

### API (Lambda Function)
- **Runtime**: Node.js 20
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **URL**: Function URL enabled for direct access
- **Environment Variables**:
  - `DATABASE_URL`: Auto-injected from Aurora connection
  - `OPENAI_API_KEY`: From AWS Secrets Manager
  - `PHARMACY_API_URL`: MockAPI endpoint

### Frontend (Static Site)
- **Build Command**: `npm run build`
- **Output Directory**: `build/`
- **Distribution**: CloudFront with S3 origin
- **Environment**: `REACT_APP_API_URL` injected at build time

## Cost Estimates

### Development Stage (light usage)
- **Aurora Serverless**: ~$0.50/hour when active (scales to 0)
- **Lambda**: Free tier covers most dev usage
- **CloudFront**: ~$0.085 per GB transfer
- **Secrets Manager**: $0.40/month per secret

**Estimated**: $20-40/month for dev

### Production Stage (moderate usage)
- **Aurora Serverless**: ~$100-200/month (depends on load)
- **Lambda**: ~$20-50/month (1M requests)
- **CloudFront**: ~$10-30/month
- **Data Transfer**: ~$10-20/month

**Estimated**: $140-300/month for production

## Monitoring

### View Logs

```bash
# API logs
npx sst shell
# Then access CloudWatch Logs

# Or use AWS CLI
aws logs tail /aws/lambda/pharmacy-chatbot-production-PharmacyAPI --follow
```

### CloudWatch Metrics

SST automatically creates CloudWatch dashboards for:
- Lambda invocations
- Lambda errors
- Lambda duration
- Database connections
- Database queries

Access at: AWS Console → CloudWatch → Dashboards

### Alarms

Set up alarms for:
```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name pharmacy-api-errors \
  --alarm-description "API Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# Database CPU
aws cloudwatch put-metric-alarm \
  --alarm-name pharmacy-db-cpu \
  --alarm-description "Database CPU utilization" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Updating the Application

### Deploy Code Changes

```bash
# Make your code changes
# Then deploy
npm run deploy:dev  # for dev
npm run deploy      # for production

# SST automatically detects changes and updates only affected resources
```

### Update Environment Variables

Edit `sst.config.ts` and add/modify environment variables, then redeploy.

### Database Migrations

```bash
# Create migration
cd backend
npm run migration:create

# Apply migration in production
npx sst shell --stage production
cd backend
npm run migration:up
```

## Rollback

```bash
# SST keeps previous deployments
# To rollback, you can:

# 1. Redeploy previous code
git checkout <previous-commit>
npm run deploy

# 2. Or use AWS Lambda versions/aliases
aws lambda update-alias \
  --function-name pharmacy-chatbot-production-PharmacyAPI \
  --name live \
  --function-version <previous-version>
```

## Cleanup

### Remove Development Stack

```bash
npx sst remove --stage dev
```

### Remove Production Stack

```bash
npx sst remove --stage production
```

**Note**: This removes all resources including database. Data will be lost unless you have backups.

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm run install:all

      - name: Run tests
        run: npm test

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to AWS
        run: npm run deploy
```

## Troubleshooting

### Lambda Cold Starts

If Lambda is slow on first request:
- Increase memory allocation (in `sst.config.ts`)
- Use provisioned concurrency (costs more but eliminates cold starts)

```typescript
// In sst.config.ts
const api = new sst.aws.Function("PharmacyAPI", {
  // ... other config
  reservedConcurrency: 5, // Keep 5 warm instances
});
```

### Database Connection Issues

If database connections fail:
- Check security groups allow Lambda → RDS
- Verify DATABASE_URL is correct
- Check RDS is not paused (Aurora Serverless pauses after inactivity)

### Frontend Not Loading API

If frontend can't reach API:
- Check CORS is enabled in Lambda
- Verify API URL in frontend build
- Check CloudFront distribution settings

## Best Practices

1. **Use Stages**: Separate dev, staging, production
2. **Monitor Costs**: Set up AWS Budget alerts
3. **Enable Backups**: Aurora automatic backups enabled by default
4. **Secrets Rotation**: Rotate OpenAI API key periodically
5. **Least Privilege**: IAM roles have minimal required permissions
6. **Database Scaling**: Monitor ACU usage and adjust min/max
7. **Lambda Optimization**: Keep Lambda package size small
8. **CloudFront Caching**: Configure appropriate cache policies

## Security Checklist

- [x] Secrets in AWS Secrets Manager (not in code)
- [x] CORS configured for specific origins
- [x] Database in private subnet
- [x] Lambda has minimal IAM permissions
- [x] CloudFront HTTPS only
- [x] Input validation on API
- [x] SQL injection prevention (ORM)
- [x] Rate limiting (API Gateway if needed)

## Additional Resources

- **SST Documentation**: https://sst.dev/docs
- **AWS Lambda**: https://docs.aws.amazon.com/lambda
- **Aurora Serverless**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html
- **CloudFront**: https://docs.aws.amazon.com/cloudfront

---

**Deployment Status**: ✅ Ready for AWS deployment with SST
