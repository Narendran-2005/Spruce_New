package com.spruce.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spruce.model.Message;
import com.spruce.model.User;
import com.spruce.repository.MessageRepository;
import com.spruce.repository.UserRepository;
import com.spruce.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SpruceWebSocketHandler extends TextWebSocketHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(SpruceWebSocketHandler.class);
    
    // Map userId -> WebSocketSession
    private final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();
    
    // Map sessionId -> userId for reverse lookup
    private final Map<String, Long> sessionToUserId = new ConcurrentHashMap<>();
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        logger.info("WebSocket connection established: {}", session.getId());
        
        // Extract JWT token from query parameters
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            String query = uri.getQuery();
            String token = null;
            for (String param : query.split("&")) {
                if (param.startsWith("token=")) {
                    token = param.substring(6); // "token=".length()
                    break;
                }
            }
            
            if (token != null) {
                try {
                    String username = jwtService.extractUsername(token);
                    if (username != null && jwtService.validateToken(token)) {
                        User user = userRepository.findByUsername(username).orElse(null);
                        if (user != null) {
                            sessions.put(user.getId(), session);
                            sessionToUserId.put(session.getId(), user.getId());
                            logger.info("Authenticated WebSocket session for user: {} (id: {})", username, user.getId());
                            return;
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error authenticating WebSocket session", e);
                }
            }
        }
        
        logger.warn("WebSocket connection established without valid authentication");
        session.close(CloseStatus.POLICY_VIOLATION);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = sessionToUserId.remove(session.getId());
        if (userId != null) {
            sessions.remove(userId);
            logger.info("WebSocket connection closed for user: {}", userId);
        } else {
            logger.info("WebSocket connection closed: {}", session.getId());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Long senderId = sessionToUserId.get(session.getId());
            if (senderId == null) {
                logger.warn("Received message from unauthenticated session: {}", session.getId());
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }
            
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");
            
            switch (type) {
                case "handshake":
                    handleHandshake(session, senderId, payload);
                    break;
                case "message":
                    handleMessage(session, senderId, payload);
                    break;
                default:
                    logger.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            logger.error("Error handling message", e);
            try {
                session.sendMessage(new TextMessage("{\"error\": \"Invalid message format\"}"));
            } catch (IOException ioException) {
                logger.error("Error sending error message", ioException);
            }
        }
    }

    private void handleHandshake(WebSocketSession session, Long senderId, Map<String, Object> payload) throws IOException {
        Object receiverIdObj = payload.get("receiverId");
        if (receiverIdObj == null) {
            logger.warn("Handshake missing receiverId");
            return;
        }
        
        Long receiverId;
        if (receiverIdObj instanceof Number) {
            receiverId = ((Number) receiverIdObj).longValue();
        } else {
            receiverId = Long.valueOf(receiverIdObj.toString());
        }
        
        // Get sender's public keys
        User sender = userRepository.findById(senderId).orElse(null);
        if (sender == null) {
            logger.warn("Sender not found: {}", senderId);
            return;
        }
        
        // Create handshake relay message with sender's public keys
        Map<String, Object> handshakeRelay = new HashMap<>(payload);
        handshakeRelay.put("senderId", senderId);
        handshakeRelay.put("sender_pub_x25519", sender.getPermPubX25519());
        handshakeRelay.put("sender_kyber_pub", sender.getKyberPub());
        handshakeRelay.put("sender_dilithium_pub", sender.getDilithiumPub());
        
        // Relay handshake to receiver
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(handshakeRelay)));
            logger.info("Handshake relayed from {} to {}", senderId, receiverId);
        } else {
            logger.warn("Receiver session not found or closed: {}", receiverId);
        }
    }

    private void handleMessage(WebSocketSession session, Long senderId, Map<String, Object> payload) throws IOException {
        Object receiverIdObj = payload.get("receiverId");
        if (receiverIdObj == null) {
            logger.warn("Message missing receiverId");
            return;
        }
        
        Long receiverId;
        if (receiverIdObj instanceof Number) {
            receiverId = ((Number) receiverIdObj).longValue();
        } else {
            receiverId = Long.valueOf(receiverIdObj.toString());
        }
        String ciphertext = (String) payload.get("ciphertext");
        String iv = (String) payload.get("iv");
        
        // Save message to database
        Message message = new Message();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setCiphertext(ciphertext);
        message.setIv(iv);
        messageRepository.save(message);
        
        // Create message relay with senderId
        Map<String, Object> messageRelay = new HashMap<>(payload);
        messageRelay.put("senderId", senderId);
        messageRelay.put("id", message.getId());
        messageRelay.put("ts", System.currentTimeMillis());
        
        // Relay to receiver
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(messageRelay)));
            logger.info("Message relayed from {} to {}", senderId, receiverId);
        } else {
            logger.warn("Receiver session not found or closed: {}", receiverId);
        }
    }
}


