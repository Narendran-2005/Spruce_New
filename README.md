# 🌲 Spruce - Post-Quantum Secure Messaging Platform

A Discord-inspired messaging platform with **hybrid post-quantum encryption**, forward/backward secrecy, persistent sessions, and full-featured messaging functionality.

## ✨ Features

### 🔐 Security Features
- **Hybrid Post-Quantum Cryptography**: Combines classical (X25519) and quantum-resistant (Kyber, Dilithium) algorithms
- **Forward Secrecy**: Ephemeral keys per session
- **Backward Secrecy**: New sessions generate fresh keys
- **Authentication**: Dilithium digital signatures
- **End-to-End Encryption**: AES-GCM with hybrid key derivation

### 💬 Messaging
- Real-time encrypted messaging via WebSocket
- 1-on-1 and group chats
- Persistent chat history
- Discord-like UI with dark theme

### 🛡️ Technical Architecture
- **Server**: Spring Boot with JWT authentication
- **Client**: React with hybrid encryption
- **Database**: PostgreSQL for message storage
- **Real-time**: WebSocket for message relay

## 🏗️ Project Structure

```
Spruce_New/
├── Spruce-Server/          # Spring Boot Backend
│   ├── src/main/java/com/spruce/
│   │   ├── config/         # Security & WebSocket config
│   │   ├── controller/     # REST API controllers
│   │   ├── model/          # Database entities
│   │   ├── repository/     # JPA repositories
│   │   ├── service/        # Business logic
│   │   └── websocket/      # WebSocket handler
│   └── src/main/resources/
│       └── application.properties
│
└── Spruce-Client/          # React Frontend
    ├── src/
    │   ├── components/     # UI components
    │   ├── pages/          # Login, Chat pages
    │   ├── services/       # API client
    │   └── utils/          # Encryption utilities
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 16+
- PostgreSQL 12+

### 1. Database Setup

**Option A: H2 (Development - No setup required)**
The backend is configured to use H2 in-memory database by default. Just run the server.

**Option B: PostgreSQL (Production)**
```bash
# Create PostgreSQL database
sudo -u postgres psql

CREATE DATABASE spruce_db;
CREATE USER spruce_user WITH PASSWORD 'spruce_pass';
GRANT ALL PRIVILEGES ON DATABASE spruce_db TO spruce_user;
\q
```

Then update `Spruce-Server/src/main/resources/application.properties` to use PostgreSQL (see backend README).

### 2. Backend Setup

```bash
cd Spruce-Server

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

Server runs on `http://localhost:8080`

### 3. Frontend Setup

```bash
cd Spruce-Client

# Install dependencies
npm install

# Run development server
npm run dev
```

Client runs on `http://localhost:5173` (Vite default port)

**Note:** The client is configured to connect to `http://localhost:8080/api` by default. If your backend runs on a different port, create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
  ```json
  {
    "username": "user1",
    "password": "password123",
    "publicKeys": {
      "perm_pub_x25519": "...",
      "kyber_pub": "...",
      "dilithium_pub": "..."
    }
  }
  ```
- `POST /api/auth/login` - Login user
  ```json
  {
    "username": "user1",
    "password": "password123"
  }
  ```
- `GET /api/auth/me` - Get current user (requires JWT)

### Users
- `GET /api/users/{id}/keys` - Get user's public keys (for key exchange)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search?q=query` - Search users

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts/add/{userId}` - Add contact
- `DELETE /api/contacts/remove/{userId}` - Remove contact

### Groups
- `POST /api/groups/create` - Create group
- `GET /api/groups` - Get user's groups
- `POST /api/groups/{id}/join` - Join group
- `POST /api/groups/{id}/leave` - Leave group

### Messages
- `GET /api/messages/history/{peerId}` - Get message history with a user (requires JWT)
- `POST /api/messages/send` - Send a message via REST (requires JWT)
  ```json
  {
    "receiverId": 2,
    "ciphertext": "...",
    "iv": "..."
  }
  ```
- `GET /api/messages/conversation/{userId}` - Get conversation history (legacy)
- `GET /api/messages/group/{groupId}` - Get group messages

### WebSocket
- Endpoint: `ws://localhost:8080/ws?token=<JWT_TOKEN>`
- Authentication: JWT token required in query parameter
- Message types: `handshake`, `message`

**Handshake Message:**
```json
{
  "type": "handshake",
  "receiverId": 2,
  "protocol_version": "spruce-hybrid-v1",
  "eph_pub": "...",
  "kyber_ct": "...",
  "timestamp": 1234567890,
  "signature": "..."
}
```

**Message:**
```json
{
  "type": "message",
  "receiverId": 2,
  "ciphertext": "...",
  "iv": "..."
}
```

## 🔐 Encryption Workflow

### Message Encryption
1. **Key Generation**: Generate ephemeral X25519 key pair
2. **Kyber Encapsulation**: Create shared secret via Kyber KEM
3. **X25519 ECDH**: Derive shared secret via X25519
4. **Hybrid Derivation**: Combine both secrets → session key
5. **Digital Signature**: Sign handshake with Dilithium
6. **Symmetric Encryption**: Encrypt message with AES-GCM

### Message Decryption
1. **Signature Verification**: Verify Dilithium signature
2. **Kyber Decapsulation**: Recover shared secret
3. **X25519 ECDH**: Derive shared secret
4. **Session Key**: Combine secrets → session key
5. **Decrypt**: Decrypt with AES-GCM

## 🛡️ Security Properties

| Property | Mechanism |
|----------|-----------|
| Forward Secrecy | Ephemeral X25519 per session |
| Backward Secrecy | New session keys for new sessions |
| Post-Quantum Safety | Kyber + Dilithium |
| Authentication | Dilithium signatures |
| Hybrid Resilience | X25519 + Kyber combined |
| Integrity | AES-GCM + Dilithium verification |
| Session Persistence | Keys maintained locally |

## 📊 Key Features Explained

### Hybrid Post-Quantum Encryption
The platform uses a **hybrid approach** combining:
- **Classical cryptography** (X25519): Fast, proven security
- **Post-quantum cryptography** (Kyber, Dilithium): Quantum-resistant
- **Combined session keys**: Best of both worlds

### Forward Secrecy
Each session uses a unique ephemeral key. If long-term keys are compromised, past sessions remain secure.

### Persistent Sessions
Session keys are stored locally in browser storage, allowing message decryption even after refresh.

## 🧪 Testing

### Test User Registration
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "publicKeys": {
      "perm_pub_x25519": "test_key_1",
      "kyber_pub": "test_key_2",
      "dilithium_pub": "test_key_3"
    }
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## 🔧 Configuration

### Backend (`application.properties`)
```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/spruce_db
jwt.secret=YourSecretKey
```

### Frontend (`vite.config.js`)
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

## 📚 Key Concepts

### Handshake Protocol
1. Sender generates ephemeral key
2. Sender performs Kyber encapsulation
3. Sender computes X25519 shared secret
4. Sender derives hybrid session key
5. Sender signs handshake with Dilithium
6. Recipient verifies signature
7. Recipient performs key derivation
8. Both parties have shared session key

### Message Flow
1. User types message in client
2. Client encrypts with session key
3. Client sends via WebSocket to server
4. Server relays to recipient
5. Recipient decrypts with session key
6. Message displayed to user

## 🚨 Important Notes

### Security Warnings
- ⚠️ **Private keys are stored locally** in browser localStorage. Never send them to the server.
- ⚠️ This is a **demonstration implementation**. For production, use proper PQC libraries (liboqs, BouncyCastle).
- ⚠️ The encryption utilities use **simulated crypto**. Replace with real implementations for production.

### Known Limitations
- WebSocket uses in-memory session storage (not persistent across restarts)
- No message read receipts
- Simplified group messaging (no member verification)
- Encryption is simulated (use real crypto libraries in production)

## 🛣️ Roadmap

- [ ] Implement real PQC libraries (liboqs, BouncyCastle)
- [ ] Add message read receipts
- [ ] Implement file sharing with encryption
- [ ] Add voice/video calling
- [ ] Mobile apps (React Native)
- [ ] Web admin console with session monitoring
- [ ] End-to-end encrypted file sharing
- [ ] Group admin features

## 📄 License

This project is for educational purposes. Use at your own risk.

## 👥 Authors

Built with ❤️ for Post-Quantum Security

---

**🌲 Spruce - When Quantum Security Meets Modern Messaging**






