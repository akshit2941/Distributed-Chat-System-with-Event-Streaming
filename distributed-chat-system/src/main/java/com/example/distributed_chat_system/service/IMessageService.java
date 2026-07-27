package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.Message;

import java.util.List;

public interface IMessageService {
    Message save(Message message);

    List<Message> getMessagesByRoom(Long roomId);
}
