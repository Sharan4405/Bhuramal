#!/bin/bash

# Bhuramal Production Deployment Script
# For VPS deployment (Ubuntu/Debian)

set -e  # Exit on error

echo "🚀 Starting Bhuramal Deployment..."

# Configuration
APP_DIR="/var/www/bhuramal"
BRANCH="main"
PM2_BACKEND="bhuramal-backend"
PM2_FRONTEND="bhuramal-frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to app directory
cd $APP_DIR || { echo -e "${RED}❌ Failed to navigate to $APP_DIR${NC}"; exit 1; }

echo -e "${YELLOW}📥 Pulling latest code from $BRANCH...${NC}"
git pull origin $BRANCH || { echo -e "${RED}❌ Git pull failed${NC}"; exit 1; }

# Backend deployment
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
npm install --production || { echo -e "${RED}❌ Backend npm install failed${NC}"; exit 1; }

# Frontend deployment
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd client
npm install --production || { echo -e "${RED}❌ Frontend npm install failed${NC}"; exit 1; }

echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build || { echo -e "${RED}❌ Frontend build failed${NC}"; exit 1; }

cd ..

# Restart services
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
pm2 restart $PM2_BACKEND || pm2 start src/server.js --name $PM2_BACKEND

echo -e "${YELLOW}🔄 Restarting frontend service...${NC}"
cd client
pm2 restart $PM2_FRONTEND || pm2 start npm --name $PM2_FRONTEND -- start
cd ..

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
echo "📝 View logs:"
echo "  Backend:  pm2 logs $PM2_BACKEND"
echo "  Frontend: pm2 logs $PM2_FRONTEND"
