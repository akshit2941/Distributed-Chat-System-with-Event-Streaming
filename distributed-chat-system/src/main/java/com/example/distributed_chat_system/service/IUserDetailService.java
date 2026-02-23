package com.example.distributed_chat_system.service;

import org.springframework.security.core.userdetails.UserDetails;

public interface IUserDetailService {
    UserDetails loadUserByUsername(String username);
}
