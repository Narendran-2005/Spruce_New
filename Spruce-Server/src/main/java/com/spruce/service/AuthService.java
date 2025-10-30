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

    public Map<String, Object> register(User user) {
        Map<String, Object> response = new HashMap<>();
        
        if (userService.existsByEmail(user.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return response;
        }
        
        if (userService.existsByUsername(user.getUsername())) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return response;
        }
        
        User registeredUser = userService.register(user);
        String token = jwtService.generateToken(registeredUser.getEmail());
        
        response.put("success", true);
        response.put("token", token);
        response.put("user", registeredUser);
        return response;
    }

    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();
        
        User user = userService.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid credentials");
            return response;
        }
        
        String token = jwtService.generateToken(user.getEmail());
        
        response.put("success", true);
        response.put("token", token);
        response.put("user", user);
        return response;
    }
}

