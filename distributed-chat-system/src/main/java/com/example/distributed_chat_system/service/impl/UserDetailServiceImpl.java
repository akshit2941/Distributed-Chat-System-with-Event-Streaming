package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.User;
import com.example.distributed_chat_system.repository.UserRepository;
import com.example.distributed_chat_system.service.IUserDetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailServiceImpl implements IUserDetailService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username){
        User user = userRepository.findByUsername(username);
        if(user==null){
            throw new UsernameNotFoundException("User Not Found");
        }

        log.info("Loading user: {}, password from DB: {}", username, user.getPassword());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.emptyList()
        );
    }
}
