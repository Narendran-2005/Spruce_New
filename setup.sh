#!/bin/bash

echo "🌲 Spruce Setup Script"
echo "======================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -ge 17 ]; then
        echo -e "${GREEN}✓${NC} Java $JAVA_VERSION"
    else
        echo -e "${RED}✗${NC} Java 17+ required (found $JAVA_VERSION)"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Java not found"
    exit 1
fi

# Check Maven
if command -v mvn &> /dev/null; then
    echo -e "${GREEN}✓${NC} Maven"
else
    echo -e "${RED}✗${NC} Maven not found"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 16 ]; then
        echo -e "${GREEN}✓${NC} Node.js v$NODE_VERSION"
    else
        echo -e "${RED}✗${NC} Node.js 16+ required (found v$NODE_VERSION)"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL"
else
    echo -e "${RED}✗${NC} PostgreSQL not found"
    exit 1
fi

echo ""
echo "📦 Setting up database..."
echo ""

# Create database (assuming passwordless sudo or user has permissions)
sudo -u postgres psql -c "CREATE DATABASE spruce_db;" 2>/dev/null || echo -e "${YELLOW}⚠${NC} Database might already exist"
sudo -u postgres psql -c "CREATE USER spruce_user WITH PASSWORD 'spruce_pass';" 2>/dev/null || echo -e "${YELLOW}⚠${NC} User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE spruce_db TO spruce_user;" 2>/dev/null

echo -e "${GREEN}✓${NC} Database setup complete"
echo ""
echo "🔨 Building backend..."
echo ""

# Build backend
cd Spruce-Server
mvn clean install -DskipTests

echo ""
echo -e "${GREEN}✓${NC} Backend build complete"
echo ""
echo "📦 Installing frontend dependencies..."
echo ""

# Install frontend dependencies
cd ../Spruce-Client
npm install

echo ""
echo -e "${GREEN}✓${NC} Frontend setup complete"
echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd Spruce-Server && mvn spring-boot:run"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd Spruce-Client && npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "📖 For more info, see README.md or QUICKSTART.md"

