package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.User;
import com.example.distributed_chat_system.repository.UserRepository;
import com.example.distributed_chat_system.service.IUserDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailServiceImpl implements IUserDetailService {

    private final UserRepository userRepository;

    public UserDetails loadUserByUsername(String username){
        User user = userRepository.findByUsername(username);

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.emptyList()
        );
    }
}
