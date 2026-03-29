package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.ChatRooms;

import java.util.List;

public interface IChatRoomService {
    ChatRooms save(ChatRooms chatRooms);

    List<ChatRooms> getAll();
}
