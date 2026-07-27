package com.example.distributed_chat_system.repository;

import com.example.distributed_chat_system.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoomOrderByCreatedAtAsc(Long room);
}
