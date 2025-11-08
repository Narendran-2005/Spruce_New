# 🚀 Quick Start Guide

Get Spruce up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Java version (needs 17+)
java -version

# Check Maven
mvn -version

# Check Node.js (needs 16+)
node -v

# Check PostgreSQL
psql --version
```

## Step 1: Database Setup (2 minutes)

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Run these commands:
CREATE DATABASE spruce_db;
CREATE USER spruce_user WITH PASSWORD 'spruce_pass';
GRANT ALL PRIVILEGES ON DATABASE spruce_db TO spruce_user;
\q
```

## Step 2: Start Backend (1 minute)

```bash
cd Spruce-Server

# Build and run
mvn clean spring-boot:run
```

✅ Backend is running on http://localhost:8080

## Step 3: Start Frontend (1 minute)

Open a new terminal:

```bash
cd Spruce-Client

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

✅ Frontend is running on http://localhost:3000

## Step 4: Test It! (1 minute)

1. Open http://localhost:3000 in your browser
2. Click "Register"
3. Create an account with:
   - Email: `user1@test.com`
   - Username: `user1`
   - Password: `password123`
4. Click Register

✅ You're logged in! The app will generate your encryption keys automatically.

## 🎉 Success!

You now have:
- ✅ Post-quantum secure messaging
- ✅ Hybrid encryption (X25519 + Kyber + Dilithium)
- ✅ WebSocket real-time chat
- ✅ Persistent encrypted messages

## 🔍 Next Steps

- Open a second browser window and create another user
- Send encrypted messages between users
- Check the browser console to see encryption/decryption logs
- Explore the code to understand the hybrid encryption flow

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change port in Spruce-Server/src/main/resources/application.properties
server.port=8081
```

**Database connection error?**
```bash
# Make sure PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

**npm install errors?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📖 Learn More

- Read the full [README.md](README.md) for detailed documentation
- Check out [QUICKSTART_ENCRYPTION.md](QUICKSTART_ENCRYPTION.md) for encryption details
- Explore the code to see how post-quantum crypto works!

---

**Happy Secure Messaging! 🎉**


