package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.config.JwtProvider;
import com.example.distributed_chat_system.dto.LoginRequest;
import com.example.distributed_chat_system.dto.LoginResponse;
import com.example.distributed_chat_system.entity.User;
import com.example.distributed_chat_system.repository.UserRepository;
import com.example.distributed_chat_system.service.IAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements IAuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    @Override
    public LoginResponse login(LoginRequest request) {

        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String token = jwtProvider.generateToken(userDetails);

        return new LoginResponse(token);
    }

    @Override
    public String generatePassword(String password) {
        return passwordEncoder.encode(password);
    }

    @Override
    public String register(String username, String password, String email) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password)); // Encode properly
        user.setEmail(email);
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
        return "User registered successfully";
    }
}
