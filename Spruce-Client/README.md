# Spruce Client

Secure real-time messaging client with hybrid post-quantum crypto.

## Stack
- React (Vite)
- TailwindCSS
- Zustand
- WebSocket
- Crypto: Kyber768, X25519, Dilithium3, AES-256-GCM, HKDF(SHA-256)

## Quick Start

```bash
npm install
npm run dev
```

## Environment
Create `.env` (or `.env.local`):

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## Features
- Client-only crypto; server is a relay.
- Hybrid session key: HKDF(SHA256(X25519 || Kyber))
- Messages encrypted with AES-256-GCM
- Handshake and messages signed/verified with Dilithium3
- Keys persisted locally (localStorage; swap to IndexedDB if needed)

## Project Structure
See `src/` for API, crypto, hooks, pages, and components. Entry is `src/main.jsx` and `src/App.jsx` with React Router.

## Notes
- Registration generates X25519, Kyber768, and Dilithium3 keys. Public keys are posted to backend.
- If backend endpoints are unavailable, contacts load a simple mock set for testing.
- WebSocket URL expects JWT via `?token=` query.

## Security
- All crypto runs client-side; keep private keys local.
- Consider replacing localStorage with IndexedDB for improved control and quotas.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview build

