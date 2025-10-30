package com.spruce.controller;

import com.spruce.model.User;
import com.spruce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    
    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.findById(user.getId()).orElse(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        Optional<User> user = userService.findById(id);
        return user.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        Optional<User> user = userService.findByUsername(username);
        return user.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(Authentication authentication, @RequestBody User updatedUser) {
        User user = (User) authentication.getPrincipal();
        User currentUser = userService.findById(user.getId()).orElse(null);
        
        if (currentUser != null) {
            if (updatedUser.getUsername() != null) currentUser.setUsername(updatedUser.getUsername());
            if (updatedUser.getAvatar() != null) currentUser.setAvatar(updatedUser.getAvatar());
            if (updatedUser.getBio() != null) currentUser.setBio(updatedUser.getBio());
            if (updatedUser.getStatus() != null) currentUser.setStatus(updatedUser.getStatus());
            
            return ResponseEntity.ok(userService.updateUser(currentUser));
        }
        
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/profile/keys")
    public ResponseEntity<User> updateKeys(Authentication authentication, @RequestBody Map<String, String> keys) {
        User user = (User) authentication.getPrincipal();
        User currentUser = userService.findById(user.getId()).orElse(null);
        
        if (currentUser != null) {
            if (keys.containsKey("x25519PublicKey")) currentUser.setX25519PublicKey(keys.get("x25519PublicKey"));
            if (keys.containsKey("kyberPublicKey")) currentUser.setKyberPublicKey(keys.get("kyberPublicKey"));
            if (keys.containsKey("dilithiumPublicKey")) currentUser.setDilithiumPublicKey(keys.get("dilithiumPublicKey"));
            
            return ResponseEntity.ok(userService.updateUser(currentUser));
        }
        
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String q) {
        List<User> users = userService.searchUsers(q);
        return ResponseEntity.ok(users);
    }
}

