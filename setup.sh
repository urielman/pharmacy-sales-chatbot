#!/bin/bash

set -e

echo "🚀 Pharmesol Pharmacy Chatbot Setup"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Setup environment
echo "🔧 Setting up environment..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your OpenAI API key!"
    echo ""
    echo "Open .env in your editor and replace 'your-openai-api-key' with your actual key."
    echo ""
    read -p "Press Enter after you've added the API key to continue..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""

echo "🐳 Starting services with Docker Compose..."
echo ""

docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready (this may take 30-60 seconds)..."
sleep 30

echo ""
echo "🗄️  Running database migrations..."
echo ""

# Create initial migration (ignore if already exists)
docker exec pharmacy_chatbot_backend npm run migration:create -- --name init 2>/dev/null || echo "Migration already exists, skipping..."

# Run migrations
docker exec pharmacy_chatbot_backend npm run migration:up

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 Your application is running:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "📖 Check the logs:"
echo "   docker logs -f pharmacy_chatbot_backend"
echo "   docker logs -f pharmacy_chatbot_frontend"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""
echo "📚 For more info, see README.md and SETUP.md"
echo ""
