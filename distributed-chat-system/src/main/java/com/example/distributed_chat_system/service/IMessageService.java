package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.Message;

public interface IMessageService {
    Message save(Message message);
}
