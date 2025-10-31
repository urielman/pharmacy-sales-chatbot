# Pharmesol Pharmacy Sales Chatbot

An intelligent inbound sales chatbot for pharmacies, powered by OpenAI's GPT-4 with function calling capabilities. Built with NestJS, React, PostgreSQL, and MikroORM.

## 🎯 Features

- **Intelligent Phone Number Recognition**: Identifies returning pharmacies via caller ID lookup
- **External API Integration**: Fetches pharmacy details from MockAPI
- **AI-Powered Conversations**: Uses OpenAI function calling for structured interactions
- **Lead Collection**: Automatically collects information from new pharmacy leads
- **Follow-up Actions**: Schedule callbacks and send follow-up emails (mocked)
- **Volume-Based Personalization**: Tailors messaging based on prescription volume
- **State Machine**: Event-driven conversation flow management
- **Persistent Storage**: PostgreSQL database with MikroORM for conversation history
- **Modern React UI**: Clean, responsive interface with real-time chat

## 🏗️ Architecture Highlights

### Key Differentiators

1. **Database Persistence**: PostgreSQL + MikroORM (vs in-memory storage)
2. **Function Calling**: OpenAI structured outputs for precise actions
3. **State Machine Pattern**: Event-driven conversation state management
4. **API Response Caching**: 5-minute cache for pharmacy lookups
5. **Type-Safe**: Full TypeScript implementation across frontend and backend

### Tech Stack

**Backend:**
- NestJS 10
- MikroORM 6 with PostgreSQL
- OpenAI API (GPT-4 with function calling)
- TypeScript 5
- Class Validator for DTOs

**Frontend:**
- React 18 with TypeScript
- Axios for API communication
- Custom hooks for state management
- CSS with modern styling

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 16

## 📦 Project Structure

```
pharmacy-sales-chatbot/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   └── entities/          # MikroORM entities
│   │   ├── modules/
│   │   │   ├── chatbot/           # Main chatbot logic
│   │   │   ├── pharmacy/          # External API integration
│   │   │   ├── ai/                # OpenAI service with functions
│   │   │   └── notifications/     # Email & callback services
│   │   ├── mikro-orm.config.ts
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── hooks/                 # Custom hooks
│   │   ├── services/              # API client
│   │   └── types/                 # TypeScript interfaces
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Getting Started

### Quick Start (5 minutes)

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env and add your OpenAI API key

# 2. Run setup script (installs everything and starts services)
./setup.sh

# 3. Open the app
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

**That's it!** The setup script handles:
- Installing all dependencies
- Starting PostgreSQL, backend, and frontend with Docker
- Running database migrations
- Setting up the environment

### Need More Details?

📖 **See [SETUP.md](./SETUP.md)** for:
- Detailed step-by-step instructions
- Running without Docker
- Database management and migrations
- Troubleshooting common issues
- Development workflow and tips

## 🧪 Testing the Chatbot

### Test Phone Numbers

The application includes test pharmacy data from the MockAPI:

1. **Returning Pharmacy**: `+1-555-123-4567`
   - Recognizes existing pharmacy
   - Shows pharmacy details
   - References Rx volume in conversation

2. **New Lead**: Any other phone number
   - Collects pharmacy information
   - Saves lead to database
   - Guides through information collection

### Conversation Flow Examples

**Returning Pharmacy:**
```
Bot: Hello! This is Pharmesol calling for John at HealthFirst Pharmacy...
User: Hi, I'm interested in your inventory management system
Bot: [Discusses solutions based on their Rx volume]
User: Can you send me more information?
Bot: [Uses function calling to offer email/callback]
```

**New Lead:**
```
Bot: Hello! Thank you for calling Pharmesol. Could you tell me the name of your pharmacy?
User: Sure, it's City Pharmacy
Bot: [Collects info using AI function calling]
Bot: [Offers follow-up options once info is collected]
```

## 🔬 API Endpoints

### Start Chat
```http
POST /api/chatbot/start
Content-Type: application/json

{
  "phoneNumber": "+1-555-123-4567"
}
```

### Send Message
```http
POST /api/chatbot/message
Content-Type: application/json

{
  "conversationId": 1,
  "message": "I'm interested in your services"
}
```

### Schedule Callback
```http
POST /api/chatbot/schedule-callback
Content-Type: application/json

{
  "conversationId": 1,
  "preferredTime": "Tomorrow at 2pm",
  "notes": "Discuss pricing"
}
```

### Send Email
```http
POST /api/chatbot/send-email
Content-Type: application/json

{
  "conversationId": 1,
  "email": "pharmacy@example.com",
  "includePricing": true
}
```

## 🧩 Key Implementation Details

### 1. OpenAI Function Calling

The AI service uses structured function calling for precise actions:

```typescript
{
  name: 'collect_pharmacy_info',
  description: 'Collect information from new pharmacy lead',
  parameters: {
    pharmacy_name: string,
    contact_person: string,
    email: string,
    estimated_rx_volume: number
  }
}
```

Benefits:
- Type-safe AI responses
- Clear separation between conversation and actions
- Easy to test and extend

### 2. Conversation State Machine

Event-driven state transitions:

```
INITIAL_GREETING → [PHARMACY_FOUND] → PHARMACY_IDENTIFIED
                 ↓ [PHARMACY_NOT_FOUND]
                 → COLLECTING_LEAD_INFO → [INFO_COLLECTED] → DISCUSSING_SERVICES
                                                            ↓ [FOLLOWUP_REQUESTED]
                                                            → SCHEDULING_FOLLOWUP → COMPLETED
```

### 3. Database Entities

**Conversation**: Tracks call sessions with state and pharmacy data
**Message**: Individual chat messages with metadata
**PharmacyLead**: New leads collected through conversations

### 4. Pharmacy API Integration

- Normalizes phone numbers for flexible matching
- Caches responses for 5 minutes
- Calculates monthly Rx volume from daily prescriptions
- Volume-based tier messaging (HIGH/MEDIUM/LOW)

## 📝 Testing Strategy

### Unit Tests
```bash
cd backend
npm test
```

### Test Coverage Areas

1. **Unit Tests**
   - Pharmacy service phone normalization
   - State machine transitions
   - AI function execution
   - Volume tier calculations

2. **Integration Tests**
   - Full conversation flows
   - Database persistence
   - API endpoint validation

3. **Edge Cases**
   - Invalid phone formats
   - API timeouts and failures
   - Malformed responses
   - SQL injection attempts
   - XSS in messages
   - Very long messages
   - Concurrent conversations

## 🚢 Deployment & Monitoring

### How would you deploy this LLM response generation component over AWS?

**Deployment Architecture using SST (Serverless Stack):**

This application uses **SST v3** for Infrastructure as Code deployment on AWS.

**Architecture Components:**

1. **Backend API**
   - **AWS Lambda** running NestJS application
   - **Function URL** for direct HTTP access
   - **Runtime**: Node.js 20.x
   - **Memory**: 1024 MB, Timeout: 30s
   - Serverless Express adapter for NestJS compatibility
   - Auto-scaling based on request volume

2. **Database**
   - **Aurora Serverless v2 PostgreSQL**
   - Auto-scaling from 0.5 to 4 ACU (Aurora Capacity Units)
   - Scales down to zero during inactivity (cost savings)
   - Automated backups with point-in-time recovery
   - Multi-AZ deployment for high availability

3. **Frontend**
   - **S3** for static React build assets
   - **CloudFront CDN** for global distribution and caching
   - HTTPS enforced with AWS Certificate Manager
   - Environment variables injected at build time

4. **Secrets Management**
   - **AWS Secrets Manager** for OpenAI API key
   - Automatic rotation capabilities
   - IAM-based access control

5. **Infrastructure as Code**
   - **SST v3** configuration in TypeScript (`sst.config.ts`)
   - Declarative resource definitions
   - Separate stages for dev/staging/production
   - Automatic IAM role and permission management

**Deployment Commands:**
```bash
# Development
npm run deploy:dev

# Production
npm run deploy

# Remove stack
npm run remove
```

**CI/CD Integration:**
- GitHub Actions workflow for automated deployments
- Test execution before deployment
- Database migrations via SST shell
- Rollback capabilities using Lambda versions

**See `DEPLOYMENT.md` for detailed deployment instructions.**

### How would you monitor and evaluate its performance in production?

**Monitoring Strategy:**

#### 1. Application Performance Metrics (CloudWatch + DataDog)

**Latency Metrics:**
- P50/P95/P99 response times for API endpoints
- OpenAI API call duration
- Database query execution time

**Throughput:**
- Requests per second
- Conversations initiated per hour
- Concurrent connections

**Error Rates:**
- HTTP 5xx errors
- OpenAI API failures (rate limits, timeouts)
- Database connection errors

#### 2. LLM-Specific Metrics

**Token Usage:**
- Average tokens per conversation
- Cost per conversation (track spending)
- Context window utilization

**Function Calling Accuracy:**
- % of function calls with valid parameters
- % of conversations requiring human handoff

**Conversation Quality:**
- Average conversation length (messages)
- Completion rate (conversations reaching followup/completed state)
- Lead information completeness score

#### 3. Business Metrics

**Conversion Funnel:**
- Returning pharmacy recognition rate
- New lead → email sent conversion
- New lead → callback scheduled conversion

**Pharmacy Engagement:**
- High-volume pharmacy contact frequency
- Average response time to callbacks

#### 4. Logging & Tracing

**Structured Logging (Winston + CloudWatch Logs):**
```json
{
  "timestamp": "2025-10-31T10:30:00Z",
  "level": "info",
  "conversationId": "12345",
  "phoneNumber": "555-***-1234",
  "event": "ai_function_called",
  "function": "schedule_callback",
  "latency_ms": 234,
  "tokens_used": 145
}
```

**Distributed Tracing (AWS X-Ray):**
- Trace requests through: API Gateway → Backend → OpenAI → Database
- Identify bottlenecks in conversation flow

#### 5. Alerting (PagerDuty + Slack)

**Critical Alerts:**
- OpenAI API error rate > 5%
- Database connection pool exhausted
- ECS service unhealthy for > 2 minutes
- Cost anomaly (OpenAI usage spike)

**Warning Alerts:**
- P95 latency > 3 seconds
- Pharmacy API unavailable
- Cache hit rate < 70%

#### 6. Quality Assurance

**Automated Testing in Production:**
- Synthetic monitoring (DataDog Synthetics)
- Daily test conversations with known phone numbers
- Assert expected responses and state transitions

**LLM Output Evaluation:**
- Weekly manual review of random conversation samples
- Checklist: Tone, accuracy, no hallucinations
- A/B testing different system prompts

**Cost Monitoring:**
- AWS Cost Explorer tags by environment/service
- OpenAI usage dashboard tracking cost per conversation
- Token efficiency trends

#### 7. Continuous Improvement

- Monthly performance review meetings
- Quarterly LLM model upgrades (GPT-4 → GPT-4.5, etc.)
- Iterative prompt engineering based on production data

## 🎓 Technical Decisions

### Why PostgreSQL + MikroORM?
- Aligns with Pharmesol's tech stack preferences
- ACID compliance for conversation history
- MikroORM provides type-safe database queries
- Easy migrations and schema management

### Why OpenAI Function Calling?
- Structured, type-safe responses
- Clear separation between conversation and actions
- Better error handling than text parsing
- Easier to test and maintain

### Why State Machine Pattern?
- Explicit conversation flow management
- Easy to visualize and debug
- Scalable for complex multi-step flows
- Clear audit trail of state transitions

## 📚 Additional Notes

### Architectural Highlights

This solution demonstrates production-ready patterns:

1. **PostgreSQL persistence** for conversation history and analytics
2. **OpenAI function calling** for structured, type-safe AI interactions
3. **State machine pattern** for explicit conversation flow management
4. **API response caching** to reduce external calls and improve performance
5. **Comprehensive testing** with real database integration
6. **SST deployment** for Infrastructure as Code on AWS

### Security Considerations

- Phone number masking in logs (PII protection)
- Input validation with class-validator
- SQL injection prevention via ORM
- XSS protection in message rendering
- Rate limiting (should add in production)

### Scalability Considerations

- Database connection pooling
- API response caching
- Stateless design (horizontal scaling)
- Async processing for notifications
- Read replicas for analytics

## 📄 License

MIT

## 🤝 Contributing

This is a take-home assignment for Pharmesol.