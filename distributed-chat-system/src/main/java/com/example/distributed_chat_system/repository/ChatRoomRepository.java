package com.example.distributed_chat_system.repository;

import com.example.distributed_chat_system.entity.ChatRooms;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRooms, Long> {

    Optional<ChatRooms> findById(Long id);
}
