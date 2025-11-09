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

  useEffect(() => {
    const unsub = useSessionStore.subscribe((state) => {
      chatsRef.current = state.chats;
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!token) return;
    const url = (import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws') + `?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Connected
    };
    ws.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'handshake') {
          // Perform receiver side handshake and store session key
          const perm = decodePermanentKeys(await loadKeys());
          const senderPub = {
            x25519: data.sender_pub_x25519, // Already base64 from server
            kyber: data.sender_kyber_pub, // Already base64 from server
            dilithium: data.sender_dilithium_pub // Already base64 from server
          };
          const { session_key } = await receiverHandshake(perm, senderPub, {
            eph_pub: fromBase64(data.eph_pub),
            kyber_ct: fromBase64(data.kyber_ct),
            timestamp: data.timestamp,
            signature: fromBase64(data.signature)
          });
          setSessionKey(data.senderId, { key: session_key });
        }
        if (data.type === 'message') {
          const peerId = data.senderId;
          const sess = sessions[peerId];
          if (!sess) return; // No session yet
          const plaintext = await aesDecrypt(
            fromBase64(data.ciphertext),
            sess.key,
            fromBase64(data.iv),
            '' // aad
          );
          const text = new TextDecoder().decode(plaintext);
          const updated = { ...chatsRef.current };
          if (!updated[peerId]) updated[peerId] = [];
          updated[peerId] = [...updated[peerId], { id: data.id || crypto.randomUUID(), senderId: peerId, text, ts: data.ts || Date.now() }];
          setChats(updated);
        }
      } catch (e) {
        console.error('WS message error', e);
      }
    };
    ws.onclose = () => {};
    ws.onerror = () => {};
    return () => ws.close();
  }, [token]);

  const ensureSession = useCallback(async (peer) => {
    if (sessions[peer.id]) return sessions[peer.id];
    const perm = decodePermanentKeys(await loadKeys());
    const pub = await getPublicKeys(peer.id);
    const receiverPub = {
      x25519: pub.perm_pub_x25519, // Already base64 from server
      kyber: pub.kyber_pub, // Already base64 from server
      dilithium: pub.dilithium_pub // Already base64 from server
    };
    const { session_key, handshake } = await senderHandshake(perm, receiverPub);
    setSessionKey(peer.id, { key: session_key });
    
    // Get my public keys to send with handshake
    const myKeys = await loadKeys();
    
    // Send handshake to peer via WS
    wsRef.current?.send(JSON.stringify({
      type: 'handshake',
      receiverId: peer.id,
      protocol_version: 'spruce-hybrid-v1',
      eph_pub: toBase64(handshake.eph_pub),
      kyber_ct: toBase64(handshake.kyber_ct),
      timestamp: handshake.timestamp,
      signature: toBase64(handshake.signature),
      sender_pub_x25519: myKeys.perm_pub_x25519,
      sender_kyber_pub: myKeys.kyber_pub,
      sender_dilithium_pub: myKeys.dilithium_pub
    }));
    return { key: session_key };
  }, [sessions]);

  const sendSecureMessage = useCallback(async (peer, text) => {
    const sess = sessions[peer.id] || await ensureSession(peer);
    const plaintext = new TextEncoder().encode(text);
    // aesEncrypt expects: (plaintextBytes, keyBytes, aad)
    const { iv, ciphertext } = await aesEncrypt(plaintext, sess.key, '');
    wsRef.current?.send(JSON.stringify({
      type: 'message',
      receiverId: peer.id,
      iv: toBase64(iv),
      ciphertext: toBase64(ciphertext)
    }));
    const updated = { ...chatsRef.current };
    if (!updated[peer.id]) updated[peer.id] = [];
    updated[peer.id] = [...updated[peer.id], { id: crypto.randomUUID(), senderId: user?.id, text, ts: Date.now() }];
    setChats(updated);
  }, [sessions, user]);

  return { sendSecureMessage };
}

