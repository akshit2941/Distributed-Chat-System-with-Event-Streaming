package com.example.distributed_chat_system.repository;

import com.example.distributed_chat_system.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRoomOrderByCreatedAtAsc(Long room);

    Page<Message> findByRoom(Long room, Pageable pageable);

    long countByRoomAndIdGreaterThan(Long room, Long id);

    long countByRoomAndCreatedAtGreaterThanEqual(Long room, java.time.LocalDateTime joinedAt);

    Message findTopByRoomOrderByIdDesc(Long room);
}
