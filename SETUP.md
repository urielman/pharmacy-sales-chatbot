# Setup Guide

## Quick Start

### 1. Prerequisites Check

```bash
node --version  # Should be 20+
docker --version
docker-compose --version
```

### 2. Clone and Setup

```bash
# You're already here!
cd pharmacy-sales-chatbot

# Copy environment file
cp .env.example .env
```

### 3. Add OpenAI API Key

Edit `.env` and replace with the provided key:

```env
OPENAI_API_KEY=sk-proj-key-example
```

### 4. Start Everything with Docker

```bash
npm run dev
# or
docker-compose up --build
```

Wait for services to start (about 2-3 minutes on first run).

### 5. Open Application

🎉 **Frontend:** http://localhost:3000
🔧 **Backend API:** http://localhost:3001

## Testing the Chatbot

### Test Scenario 1: Returning Pharmacy

1. Click "HealthFirst Pharmacy (Returning)" or enter: `+1-555-123-4567`
2. Notice the bot greets by pharmacy name
3. Try: "Tell me about your inventory management system"
4. Try: "Can you send me more information via email?"
5. Use action buttons to schedule callback or send email

### Test Scenario 2: New Lead

1. Click "New Lead" or enter any other phone number like: `+1-555-999-8888`
2. Bot will ask for pharmacy name
3. Respond: "City Pharmacy"
4. Bot collects more info (contact person, volume, etc.)
5. Once info collected, discuss services
6. Schedule follow-up

## Manual Installation (Without Docker)

### Step 1: Install Dependencies

```bash
# Root
npm run install:all

# Or separately
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Start PostgreSQL

```bash
docker run -d \
  --name pharmacy-db \
  -e POSTGRES_USER=pharmacy_user \
  -e POSTGRES_PASSWORD=pharmacy_pass \
  -e POSTGRES_DB=pharmacy_chatbot \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 3: Run Database Migrations

```bash
cd backend
npm run migration:up
```

### Step 4: Start Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

### Step 5: Start Frontend (Terminal 2)

```bash
cd frontend
npm start
```

## Running Tests

```bash
cd backend

# Unit tests
npm test

# Specific test file
npm test -- pharmacy.service.spec

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -ti:3000  # Frontend
lsof -ti:3001  # Backend
lsof -ti:5432  # PostgreSQL

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL container
docker restart pharmacy-db

# Check logs
docker logs pharmacy-db
```

### OpenAI API Errors

- Verify API key in `.env`
- Check if key is valid and has credits
- Look at backend logs: `docker logs pharmacy_chatbot_backend`

### Clear Everything and Start Fresh

```bash
# Stop all containers
docker-compose down -v

# Remove all containers and volumes
docker system prune -a --volumes

# Rebuild
docker-compose up --build
```

## Environment Variables Reference

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://pharmacy_user:pharmacy_pass@localhost:5432/pharmacy_chatbot
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=pharmacy_user
DATABASE_PASSWORD=pharmacy_pass
DATABASE_NAME=pharmacy_chatbot

# OpenAI
OPENAI_API_KEY=your-key-here

# External APIs
PHARMACY_API_URL=https://67e14fb758cc6bf785254550.mockapi.io/pharmacies

# Application
NODE_ENV=development
PORT=3001
```

### Frontend (.env.local)

```env
REACT_APP_API_URL=http://localhost:3001
```

## Development Workflow

### Making Changes

**Backend Code Changes:**
- Edit files in `backend/src/`
- Hot reload automatically restarts server
- Check logs: `docker logs -f pharmacy_chatbot_backend`

**Frontend Code Changes:**
- Edit files in `frontend/src/`
- Changes appear immediately (hot reload)
- No restart needed

### Adding Database Migrations

```bash
cd backend

# Create migration
npm run migration:create

# Apply migrations
npm run migration:up

# Rollback
npm run migration:down
```

### Viewing Database

```bash
# Connect to PostgreSQL
docker exec -it pharmacy_chatbot_db psql -U pharmacy_user -d pharmacy_chatbot

# Useful queries
\dt                    # List tables
SELECT * FROM conversation;
SELECT * FROM message;
SELECT * FROM pharmacy_lead;
```

## Production Deployment Notes

See main README.md for full AWS deployment architecture.

**Quick checklist:**
- [ ] Set NODE_ENV=production
- [ ] Use environment-specific secrets
- [ ] Enable database connection pooling
- [ ] Set up monitoring (CloudWatch/DataDog)
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up backups
- [ ] Enable logging and tracing

## Need Help?

Check the main [README.md](./README.md) for:
- Architecture details
- API documentation
- Testing strategy
- Deployment guide

---

**Happy coding! 🚀**
