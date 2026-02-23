package com.example.distributed_chat_system.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}
