import { useEffect, useRef, useCallback } from 'react';
import useSessionStore from '../store/sessionStore.js';
import { senderHandshake, receiverHandshake } from '../crypto/sessionHandshake.js';
import { aesEncrypt, aesDecrypt } from '../crypto/encryptionUtils.js';
import { decodePermanentKeys, loadKeys } from '../crypto/hybridKeyManager.js';
import { getPublicKeys } from '../api/contacts.js';
import { toBase64, fromBase64 } from '../utils/keyUtils.js';

export default function useWebSocket() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);
  const sessions = useSessionStore((s) => s.sessions);
  const setSessionKey = useSessionStore((s) => s.setSessionKey);
  const setChats = useSessionStore((s) => s.setChats);
  const chatsRef = useRef(useSessionStore.getState().chats);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    const unsub = useSessionStore.subscribe((state) => {
      chatsRef.current = state.chats;
    });
    return () => unsub();
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!token || isConnectingRef.current) return;
    
    // Close existing connection if any
    if (wsRef.current) {
      shouldReconnectRef.current = false;
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;
    const url = (import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws') + `?token=${encodeURIComponent(token)}`;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        console.log('✅ WebSocket connected');
      };
      
      ws.onmessage = async (ev) => {
        try {
          const data = JSON.parse(ev.data);
          console.log('📨 WebSocket message received:', data.type, 'from:', data.senderId);
          
          if (data.type === 'handshake') {
            // Normalize senderId to string for consistency
            const senderId = String(data.senderId);
            console.log('🤝 Processing handshake from:', senderId);
            try {
              // Perform receiver side handshake and store session key
              const perm = decodePermanentKeys(await loadKeys());
              if (!perm) {
                console.error('❌ No permanent keys found');
                return;
              }
              
              const senderPub = {
                x25519: data.sender_pub_x25519, // Already base64 from server
                kyber: data.sender_kyber_pub, // Already base64 from server
                dilithium: data.sender_dilithium_pub // Already base64 from server
              };
              
              // Convert base64 strings to Uint8Array for handshake
              const handshakeData = {
                eph_pub: typeof data.eph_pub === 'string' ? fromBase64(data.eph_pub) : data.eph_pub,
                kyber_ct: typeof data.kyber_ct === 'string' ? fromBase64(data.kyber_ct) : data.kyber_ct,
                timestamp: data.timestamp,
                signature: typeof data.signature === 'string' ? fromBase64(data.signature) : data.signature
              };
              
              const { session_key } = await receiverHandshake(perm, senderPub, handshakeData, senderId);
              setSessionKey(senderId, { key: session_key });
              console.log('✅ Session key established for peer:', senderId);
            } catch (e) {
              console.error('❌ Handshake failed:', e);
            }
          }
          
          if (data.type === 'message') {
            // Normalize senderId to string for consistency
            const peerId = String(data.senderId);
            if (!peerId || peerId === 'undefined' || peerId === 'null') {
              console.error('❌ Message missing senderId');
              return;
            }
            
            // Get fresh sessions state
            const currentSessions = useSessionStore.getState().sessions;
            const sess = currentSessions[peerId];
            
            if (!sess || !sess.key) {
              console.warn('⚠️ Message received but no session key for peer:', peerId);
              console.log('Available sessions:', Object.keys(currentSessions));
              // Queue message or request handshake - for now, just log
              return;
            }
            
            try {
              // Ensure ciphertext and iv are base64 strings
              const ciphertext = typeof data.ciphertext === 'string' ? data.ciphertext : toBase64(data.ciphertext);
              const iv = typeof data.iv === 'string' ? data.iv : toBase64(data.iv);
              
              const plaintext = await aesDecrypt(
                fromBase64(ciphertext),
                sess.key,
                fromBase64(iv),
                '', // aad
                peerId
              );
              const text = new TextDecoder().decode(plaintext);
              
              const updated = { ...chatsRef.current };
              if (!updated[peerId]) updated[peerId] = [];
              updated[peerId] = [...updated[peerId], { 
                id: data.id || crypto.randomUUID(), 
                senderId: peerId, 
                text, 
                ts: data.ts || Date.now() 
              }];
              setChats(updated);
              console.log('✅ Message decrypted and added to chat:', text.substring(0, 50));
            } catch (e) {
              console.error('❌ Failed to decrypt message from', peerId, ':', e);
            }
          }
        } catch (e) {
          console.error('❌ WS message error:', e);
        }
      };
      
      ws.onclose = (event) => {
        isConnectingRef.current = false;
        
        // Don't log normal closures
        if (event.code !== 1000 && event.code !== 1001) {
          console.log('🔌 WebSocket closed:', event.code, event.reason || 'No reason provided');
        }
        
        // Only reconnect if we should and it wasn't a normal closure
        if (shouldReconnectRef.current && event.code !== 1000 && event.code !== 1001) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current && token) {
              console.log(`🔄 Reconnecting WebSocket (attempt ${reconnectAttemptsRef.current})...`);
              connectWebSocket();
            }
          }, delay);
        }
      };
      
      ws.onerror = (error) => {
        isConnectingRef.current = false;
        // Error details are usually in onclose, so we don't need to log here
        // to avoid duplicate error messages
      };
    } catch (error) {
      isConnectingRef.current = false;
      console.error('❌ Failed to create WebSocket:', error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      shouldReconnectRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    shouldReconnectRef.current = true;
    connectWebSocket();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [token, connectWebSocket]);

  const ensureSession = useCallback(async (peer) => {
    // Normalize peer ID to string for consistency
    const peerId = String(peer.id);
    
    // Get fresh sessions state
    const currentSessions = useSessionStore.getState().sessions;
    if (currentSessions[peerId]) {
      console.log('✅ Session already exists for peer:', peerId);
      return currentSessions[peerId];
    }
    
    console.log('🤝 Initiating handshake with peer:', peerId);
    try {
      const perm = decodePermanentKeys(await loadKeys());
      if (!perm) {
        throw new Error('No permanent keys found');
      }
      
      const pub = await getPublicKeys(peer.id);
      if (!pub) {
        throw new Error('Failed to get public keys for peer');
      }
      
      const receiverPub = {
        x25519: pub.perm_pub_x25519, // Already base64 from server
        kyber: pub.kyber_pub, // Already base64 from server
        dilithium: pub.dilithium_pub // Already base64 from server
      };
      
      const { session_key, handshake } = await senderHandshake(perm, receiverPub, peerId);
      setSessionKey(peerId, { key: session_key });
      console.log('✅ Session key generated for peer:', peerId);
      
      // Get my public keys to send with handshake
      const myKeys = await loadKeys();
      if (!myKeys) {
        throw new Error('Failed to load my keys');
      }
      
      // Send handshake to peer via WS (use original peer.id for server, which handles conversion)
      const handshakeMessage = {
        type: 'handshake',
        receiverId: peer.id, // Server will convert to Long
        protocol_version: 'spruce-hybrid-v1',
        eph_pub: toBase64(handshake.eph_pub),
        kyber_ct: toBase64(handshake.kyber_ct),
        timestamp: handshake.timestamp,
        signature: toBase64(handshake.signature),
        sender_pub_x25519: myKeys.perm_pub_x25519,
        sender_kyber_pub: myKeys.kyber_pub,
        sender_dilithium_pub: myKeys.dilithium_pub
      };
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(handshakeMessage));
        console.log('📤 Handshake sent to peer:', peerId);
      } else {
        throw new Error('WebSocket not connected');
      }
      
      return { key: session_key };
    } catch (e) {
      console.error('❌ Failed to establish session with peer:', peerId, e);
      throw e;
    }
  }, []);

  const sendSecureMessage = useCallback(async (peer, text) => {
    try {
      // Normalize peer ID to string for consistency
      const peerId = String(peer.id);
      console.log('📤 Sending message to peer:', peerId, 'text:', text.substring(0, 50));
      
      // Ensure session exists
      const currentSessions = useSessionStore.getState().sessions;
      let sess = currentSessions[peerId];
      
      if (!sess || !sess.key) {
        console.log('🤝 No session found, establishing...');
        sess = await ensureSession(peer);
      }
      
      if (!sess || !sess.key) {
        throw new Error('Failed to establish session');
      }
      
      const plaintext = new TextEncoder().encode(text);
      // aesEncrypt expects: (plaintextBytes, keyBytes, aad, peerId)
      const { iv, ciphertext } = await aesEncrypt(plaintext, sess.key, '', peerId);
      
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }
      
      const message = {
        type: 'message',
        receiverId: peer.id, // Server will convert to Long
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext)
      };
      
      wsRef.current.send(JSON.stringify(message));
      console.log('✅ Message sent to peer:', peerId);
      
      // Add to local chat immediately (use normalized peerId for storage)
      const updated = { ...chatsRef.current };
      if (!updated[peerId]) updated[peerId] = [];
      updated[peerId] = [...updated[peerId], { 
        id: crypto.randomUUID(), 
        senderId: user?.id, 
        text, 
        ts: Date.now() 
      }];
      setChats(updated);
    } catch (e) {
      console.error('❌ Failed to send message:', e);
      throw e;
    }
  }, [user, ensureSession]);

  return { sendSecureMessage };
}

