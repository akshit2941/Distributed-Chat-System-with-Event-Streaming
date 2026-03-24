package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.ChatRooms;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.service.IChatRoomService;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements IRoomService {

    private final IChatRoomService chatRoomService;

    @Override
    public void createRoom(RoomCreateRequest request) {
        ChatRooms chatRooms = ChatRooms.builder()
                .name(request.getRoomName())
                .type(request.getType())
                .build();

        chatRoomService.save(chatRooms);
    }
}
