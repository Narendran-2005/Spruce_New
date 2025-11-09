package com.spruce.controller;

import com.spruce.model.Contact;
import com.spruce.model.User;
import com.spruce.repository.ContactRepository;
import com.spruce.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ContactController {
    
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactController(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getContacts(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        // Simplified: Return all users except current user
        // In production, filter by accepted contacts only
        List<User> allUsers = userRepository.findAll().stream()
            .filter(u -> !u.getId().equals(currentUser.getId()))
            .collect(Collectors.toList());
        
        List<Map<String, Object>> contactList = allUsers.stream()
            .map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("status", user.getStatus() != null ? user.getStatus() : "offline");
                return userMap;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(contactList);
    }

    @PostMapping("/add/{userId}")
    public ResponseEntity<Contact> addContact(Authentication authentication, @PathVariable Long userId) {
        User currentUser = (User) authentication.getPrincipal();
        
        Contact contact = new Contact();
        contact.setUserId(currentUser.getId());
        contact.setContactId(userId);
        contact.setStatus("accepted"); // Auto-accept for simplicity
        
        return ResponseEntity.ok(contactRepository.save(contact));
    }
}





