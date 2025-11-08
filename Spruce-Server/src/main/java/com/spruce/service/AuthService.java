package com.spruce.service;

import com.spruce.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;

    public Map<String, Object> register(String username, String password, Map<String, String> publicKeys) {
        Map<String, Object> response = new HashMap<>();
        
        if (userService.existsByUsername(username)) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return response;
        }
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setPermPubX25519(publicKeys.get("perm_pub_x25519"));
        user.setKyberPub(publicKeys.get("kyber_pub"));
        user.setDilithiumPub(publicKeys.get("dilithium_pub"));
        user.setStatus("online");
        
        User registeredUser = userService.register(user);
        String token = jwtService.generateToken(registeredUser.getUsername());
        
        // Return user data without password
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", registeredUser.getId());
        userData.put("username", registeredUser.getUsername());
        userData.put("status", registeredUser.getStatus());
        
        response.put("token", token);
        response.put("user", userData);
        return response;
    }

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> response = new HashMap<>();
        
        User user = userService.findByUsername(username).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        String token = jwtService.generateToken(user.getUsername());
        
        // Return user data without password
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("status", user.getStatus());
        
        response.put("token", token);
        response.put("user", userData);
        return response;
    }
    
    public User getCurrentUser(String username) {
        return userService.findByUsername(username).orElse(null);
    }
}


