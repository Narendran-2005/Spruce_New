# Spruce Server - Spring Boot Backend

Secure real-time messaging backend with hybrid post-quantum cryptography support.

## Features

- **JWT Authentication** - Username/password based authentication with JWT tokens
- **WebSocket Real-time Messaging** - Real-time message relay with JWT authentication
- **Public Key Management** - Stores X25519, Kyber768, and Dilithium3 public keys for users
- **Message History** - REST API for fetching message history
- **Contact Management** - User contact listing and management
- **Database Support** - H2 (development) and PostgreSQL (production)

## Tech Stack

- Spring Boot 3.2.0
- Spring Security
- Spring WebSocket
- Spring Data JPA
- JWT (jjwt 0.12.3)
- H2 Database (development)
- PostgreSQL (production)
- Maven

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL (for production) or H2 (included for development)

## Setup

### 1. Clone and Navigate

```bash
cd Spruce-Server
```

### 2. Database Configuration

**For Development (H2 - Default):**
The application is configured to use H2 in-memory database by default. No setup required.

**For Production (PostgreSQL):**
1. Create a PostgreSQL database:
```sql
CREATE DATABASE spruce_db;
CREATE USER spruce_user WITH PASSWORD 'spruce_pass';
GRANT ALL PRIVILEGES ON DATABASE spruce_db TO spruce_user;
```

2. Update `src/main/resources/application.properties`:
   - Comment out H2 configuration
   - Uncomment PostgreSQL configuration
   - Update connection details if needed

### 3. Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
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

- `POST /api/auth/login` - Login
  ```json
  {
    "username": "user1",
    "password": "password123"
  }
  ```

- `GET /api/auth/me` - Get current user (requires JWT)

### Contacts
- `GET /api/contacts` - Get all contacts (requires JWT)
- `POST /api/contacts/add/{userId}` - Add a contact (requires JWT)

### Users
- `GET /api/users/{id}/keys` - Get user's public keys
- `GET /api/users/{id}` - Get user profile
- `GET /api/users/search?q=query` - Search users

### Messages
- `GET /api/messages/history/{peerId}` - Get message history with a user (requires JWT)
- `POST /api/messages/send` - Send a message (requires JWT)
  ```json
  {
    "receiverId": 2,
    "ciphertext": "...",
    "iv": "..."
  }
  ```

## WebSocket

**Endpoint:** `ws://localhost:8080/ws?token=<JWT_TOKEN>`

### Message Types

**Handshake:**
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

## Configuration

Key configuration in `application.properties`:

- `server.port=8080` - Server port
- `jwt.secret=...` - JWT secret key
- `jwt.expiration=86400000` - JWT expiration (24 hours)
- CORS origins: `http://localhost:5173` (Vite) and `http://localhost:3000`

## Development

### H2 Console

Access H2 console at: `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:mem:spruce_db`
- Username: `sa`
- Password: (empty)

### Logging

Logging is configured at DEBUG level for `com.spruce` package. Check console for WebSocket connections, message relays, and authentication events.

## Security Notes

- All cryptographic operations happen on the client side
- The server only relays encrypted messages (ciphertexts)
- JWT tokens are validated for all authenticated endpoints
- WebSocket connections require valid JWT token in query parameter
- Public keys are stored in the database for key exchange

## Production Deployment

1. Switch to PostgreSQL database
2. Update `jwt.secret` with a strong, random secret
3. Configure proper CORS origins
4. Enable HTTPS
5. Set up proper logging and monitoring
6. Configure connection pooling
7. Set up database backups

## Troubleshooting

### WebSocket Connection Fails
- Ensure JWT token is valid and not expired
- Check CORS configuration
- Verify WebSocket endpoint URL includes token query parameter

### Database Connection Issues
- Check database is running (PostgreSQL)
- Verify connection credentials in `application.properties`
- For H2, ensure no port conflicts

### Authentication Fails
- Verify JWT secret matches
- Check token expiration
- Ensure username exists in database





