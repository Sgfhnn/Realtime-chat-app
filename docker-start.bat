@echo off
REM Real-Time Chat App - Docker Quick Start Script (Windows)

echo 🚀 Starting Real-Time Chat Application with Docker...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    echo    Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Stop and remove existing containers
echo 🧹 Cleaning up existing containers...
docker-compose down -v

echo.
echo 🔨 Building and starting services...
echo    - PostgreSQL Database
echo    - Redis Cache
echo    - NestJS Backend (with PM2 cluster)
echo.

REM Build and start services
docker-compose up --build -d

echo.
echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check service status
echo.
echo 📊 Service Status:
docker-compose ps

echo.
echo ✅ Application is starting!
echo.
echo 📝 Access points:
echo    Backend API: http://localhost:3001
echo    PostgreSQL:  localhost:5432
echo    Redis:       localhost:6379
echo.
echo 📋 Useful commands:
echo    View logs:        docker-compose logs -f backend
echo    Stop services:    docker-compose down
echo    Restart backend:  docker-compose restart backend
echo    View all logs:    docker-compose logs -f
echo.
echo 🎉 Setup complete! Your backend is running in cluster mode with PM2.
echo.
echo ⚠️  Note: Don't forget to start the frontend separately:
echo    cd frontend ^&^& npm run dev
echo.
pause
