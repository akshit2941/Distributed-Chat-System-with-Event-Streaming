package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.ChatRooms;

public interface IChatRoomService {
    ChatRooms save(ChatRooms chatRooms);
}
