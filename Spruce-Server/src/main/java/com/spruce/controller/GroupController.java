package com.spruce.controller;

import com.spruce.model.Group;
import com.spruce.model.User;
import com.spruce.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "http://localhost:3000")
public class GroupController {
    
    @Autowired
    private GroupRepository groupRepository;

    @PostMapping("/create")
    public ResponseEntity<Group> createGroup(Authentication authentication, @RequestBody Group group) {
        User user = (User) authentication.getPrincipal();
        group.setOwnerId(user.getId());
        group.getMemberIds().add(user.getId());
        Group savedGroup = groupRepository.save(group);
        return ResponseEntity.ok(savedGroup);
    }

    @GetMapping
    public ResponseEntity<List<Group>> getMyGroups(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Group> groups = groupRepository.findByOwnerId(user.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroup(@PathVariable Long id) {
        Optional<Group> group = groupRepository.findById(id);
        return group.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Group> joinGroup(Authentication authentication, @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        Optional<Group> groupOpt = groupRepository.findById(id);
        
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();
            group.getMemberIds().add(user.getId());
            return ResponseEntity.ok(groupRepository.save(group));
        }
        
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveGroup(Authentication authentication, @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        Optional<Group> groupOpt = groupRepository.findById(id);
        
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();
            group.getMemberIds().remove(user.getId());
            groupRepository.save(group);
            return ResponseEntity.ok().build();
        }
        
        return ResponseEntity.notFound().build();
    }
}


