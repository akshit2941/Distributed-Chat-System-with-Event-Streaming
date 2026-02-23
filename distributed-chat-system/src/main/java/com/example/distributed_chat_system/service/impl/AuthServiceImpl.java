package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.config.JwtProvider;
import com.example.distributed_chat_system.dto.LoginRequest;
import com.example.distributed_chat_system.dto.LoginResponse;
import com.example.distributed_chat_system.service.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;

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
}
