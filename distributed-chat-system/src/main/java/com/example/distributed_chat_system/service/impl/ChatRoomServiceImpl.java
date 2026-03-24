package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.ChatRooms;
import com.example.distributed_chat_system.repository.ChatRoomRepository;
import com.example.distributed_chat_system.service.IChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements IChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    @Override
    public ChatRooms save(ChatRooms chatRooms){
        return chatRoomRepository.save(chatRooms);
    }
}
