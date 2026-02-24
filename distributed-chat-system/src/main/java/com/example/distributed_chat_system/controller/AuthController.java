package com.example.distributed_chat_system.controller;

import com.example.distributed_chat_system.dto.LoginRequest;
import com.example.distributed_chat_system.dto.LoginResponse;
import com.example.distributed_chat_system.dto.RegisterRequest;
import com.example.distributed_chat_system.service.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/generate/password")
    public String generatePassword(@RequestBody String password){
        return authService.generatePassword(password);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        String result = authService.register(request.getUsername(), request.getPassword(), request.getEmail());
        return ResponseEntity.ok(result);
    }
}
