package com.spruce.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spruce.model.Message;
import com.spruce.model.User;
import com.spruce.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SpruceWebSocketHandler extends TextWebSocketHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(SpruceWebSocketHandler.class);
    
    // Map userId -> WebSocketSession
    private final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();
    
    @Autowired
    private MessageRepository messageRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        logger.info("WebSocket connection established: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // Remove session from map
        sessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
        logger.info("WebSocket connection closed: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");
            
            switch (type) {
                case "handshake":
                    handleHandshake(session, payload);
                    break;
                case "message":
                    handleMessage(session, payload);
                    break;
                case "register":
                    handleRegister(session, payload);
                    break;
                default:
                    logger.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            logger.error("Error handling message", e);
            session.sendMessage(new TextMessage("{\"error\": \"Invalid message format\"}"));
        }
    }

    private void handleRegister(WebSocketSession session, Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        sessions.put(userId, session);
        logger.info("Registered WebSocket session for user: {}", userId);
    }

    private void handleHandshake(WebSocketSession session, Map<String, Object> payload) {
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        
        // Relay handshake to receiver
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            try {
                receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
                logger.info("Handshake relayed from {} to {}", senderId, receiverId);
            } catch (IOException e) {
                logger.error("Error relaying handshake", e);
            }
        }
    }

    private void handleMessage(WebSocketSession session, Map<String, Object> payload) {
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        String ciphertext = (String) payload.get("ciphertext");
        Long groupId = payload.containsKey("groupId") ? 
                Long.valueOf(payload.get("groupId").toString()) : null;
        
        // Save message to database
        Message message = new Message();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setGroupId(groupId);
        message.setCiphertext(ciphertext);
        message.setMetadata((String) payload.get("metadata"));
        messageRepository.save(message);
        
        // Relay to receiver (for 1-on-1) or all group members (for groups)
        if (groupId == null) {
            // 1-on-1 message
            WebSocketSession receiverSession = sessions.get(receiverId);
            if (receiverSession != null && receiverSession.isOpen()) {
                try {
                    receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
                    logger.info("Message relayed from {} to {}", senderId, receiverId);
                } catch (IOException e) {
                    logger.error("Error relaying message", e);
                }
            }
        } else {
            // Group message - relay to all members (simplified, should check group membership)
            sessions.forEach((userId, wsSession) -> {
                if (!userId.equals(senderId) && wsSession.isOpen()) {
                    try {
                        wsSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
                    } catch (IOException e) {
                        logger.error("Error relaying group message", e);
                    }
                }
            });
            logger.info("Group message relayed from {} to group {}", senderId, groupId);
        }
    }
}

