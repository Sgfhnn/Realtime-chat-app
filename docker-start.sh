#!/bin/bash

# Real-Time Chat App - Docker Quick Start Script

echo "🚀 Starting Real-Time Chat Application with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v

echo ""
echo "🔨 Building and starting services..."
echo "   - PostgreSQL Database"
echo "   - Redis Cache"
echo "   - NestJS Backend (with PM2 cluster)"
echo ""

# Build and start services
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Application is starting!"
echo ""
echo "📝 Access points:"
echo "   Backend API: http://localhost:3001"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "   View logs:        docker-compose logs -f backend"
echo "   Stop services:    docker-compose down"
echo "   Restart backend:  docker-compose restart backend"
echo "   View all logs:    docker-compose logs -f"
echo ""
echo "🎉 Setup complete! Your backend is running in cluster mode with PM2."
echo ""
echo "⚠️  Note: Don't forget to start the frontend separately:"
echo "   cd frontend && npm run dev"
