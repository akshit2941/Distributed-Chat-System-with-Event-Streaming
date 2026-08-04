package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.Message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface IMessageService {
    Message save(Message message);

    List<Message> getMessagesByRoom(Long roomId);

    Page<Message> getMessagesByRoom(Long roomId, Pageable pageable);
}
