package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.dto.LoginRequest;
import com.example.distributed_chat_system.dto.LoginResponse;

public interface IAuthService {
    LoginResponse login(LoginRequest request);
}
