package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.Message;
import com.example.distributed_chat_system.repository.MessageRepository;
import com.example.distributed_chat_system.service.IMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements IMessageService {

    private final MessageRepository messageRepository;

    @Override
    public Message save(Message message){
        return messageRepository.save(message);
    }
}
