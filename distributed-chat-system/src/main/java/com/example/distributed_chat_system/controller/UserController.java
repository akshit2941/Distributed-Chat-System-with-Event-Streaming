package com.example.distributed_chat_system.controller;

import com.example.distributed_chat_system.annotations.CurrentUser;
import com.example.distributed_chat_system.entity.User;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @PostMapping("/public-key")
    public ResponseEntity<String> uploadPublicKey(
            @CurrentUser UserPrincipal userPrincipal,
            @RequestBody Map<String, String> request) {
        
        String publicKey = request.get("publicKey");
        if (publicKey == null) {
            return ResponseEntity.badRequest().body("publicKey is required");
        }

        User user = userRepository.findById(userPrincipal.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPublicKey(publicKey);
        userRepository.save(user);

        return ResponseEntity.ok("Public key uploaded successfully");
    }

    @GetMapping("/{userId}/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String pk = user.getPublicKey();
        return ResponseEntity.ok(Map.of("publicKey", pk != null ? pk : ""));
    }
}
