package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.Message;
import com.example.distributed_chat_system.repository.MessageRepository;
import com.example.distributed_chat_system.service.IMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements IMessageService {

    private final MessageRepository messageRepository;

    @Override
    public Message save(Message message){
        return messageRepository.save(message);
    }

    @Override
    public List<Message> getMessagesByRoom(Long roomId) {
        return messageRepository.findByRoomOrderByCreatedAtAsc(roomId);
    }

    @Override
    public Page<Message> getMessagesByRoom(Long roomId, Pageable pageable) {
        return messageRepository.findByRoom(roomId, pageable);
    }
}
