package com.example.distributed_chat_system.repository;

import com.example.distributed_chat_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    
    User findByUsername(String username);

    User findByEmail(String email);

}
