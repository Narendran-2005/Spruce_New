package com.spruce.controller;

import com.spruce.model.Message;
import com.spruce.model.User;
import com.spruce.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class MessageController {
    
    @Autowired
    private MessageRepository messageRepository;

    @GetMapping("/history/{peerId}")
    public ResponseEntity<List<Map<String, Object>>> getHistory(Authentication authentication, @PathVariable Long peerId) {
        User currentUser = (User) authentication.getPrincipal();
        List<Message> messages = messageRepository.findConversation(currentUser.getId(), peerId);
        
        List<Map<String, Object>> messageList = messages.stream()
            .map(msg -> Map.<String, Object>of(
                "id", msg.getId(),
                "senderId", msg.getSenderId(),
                "receiverId", msg.getReceiverId(),
                "ciphertext", msg.getCiphertext() != null ? msg.getCiphertext() : "",
                "iv", msg.getIv() != null ? msg.getIv() : "",
                "ts", msg.getTimestamp() != null ? msg.getTimestamp().toEpochSecond(java.time.ZoneOffset.UTC) * 1000 : System.currentTimeMillis()
            ))
            .toList();
        
        return ResponseEntity.ok(messageList);
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(Authentication authentication, @RequestBody Map<String, Object> request) {
        User currentUser = (User) authentication.getPrincipal();
        
        Long receiverId = Long.valueOf(request.get("receiverId").toString());
        String ciphertext = (String) request.get("ciphertext");
        String iv = (String) request.get("iv");
        
        Message message = new Message();
        message.setSenderId(currentUser.getId());
        message.setReceiverId(receiverId);
        message.setCiphertext(ciphertext);
        message.setIv(iv);
        
        Message saved = messageRepository.save(message);
        
        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "success", true
        ));
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<Message>> getConversation(Authentication authentication, @PathVariable Long userId) {
        User currentUser = (User) authentication.getPrincipal();
        List<Message> messages = messageRepository.findConversation(currentUser.getId(), userId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Message>> getGroupMessages(@PathVariable Long groupId) {
        List<Message> messages = messageRepository.findByGroupId(groupId);
        return ResponseEntity.ok(messages);
    }
}


