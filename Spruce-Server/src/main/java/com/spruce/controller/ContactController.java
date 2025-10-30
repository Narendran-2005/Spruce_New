package com.spruce.controller;

import com.spruce.model.Contact;
import com.spruce.model.User;
import com.spruce.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = "http://localhost:3000")
public class ContactController {
    
    @Autowired
    private ContactRepository contactRepository;

    @PostMapping("/add/{userId}")
    public ResponseEntity<Contact> addContact(Authentication authentication, @PathVariable Long userId) {
        User currentUser = (User) authentication.getPrincipal();
        
        Contact contact = new Contact();
        contact.setUserId(currentUser.getId());
        contact.setContactId(userId);
        contact.setStatus("pending");
        
        return ResponseEntity.ok(contactRepository.save(contact));
    }

    @DeleteMapping("/remove/{userId}")
    public ResponseEntity<Void> removeContact(Authentication authentication, @PathVariable Long userId) {
        User currentUser = (User) authentication.getPrincipal();
        contactRepository.findContact(currentUser.getId(), userId).ifPresent(contactRepository::delete);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<Contact>> getContacts(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<Contact> contacts = contactRepository.findByUserIdAndStatus(currentUser.getId(), "accepted");
        return ResponseEntity.ok(contacts);
    }

    @PostMapping("/accept/{contactId}")
    public ResponseEntity<Contact> acceptContact(@PathVariable Long contactId) {
        Contact contact = contactRepository.findById(contactId).orElse(null);
        if (contact != null) {
            contact.setStatus("accepted");
            return ResponseEntity.ok(contactRepository.save(contact));
        }
        return ResponseEntity.notFound().build();
    }
}

