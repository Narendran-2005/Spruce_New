package com.spruce.controller;

import com.spruce.model.Message;
import com.spruce.model.User;
import com.spruce.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    
    @Autowired
    private MessageRepository messageRepository;

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

