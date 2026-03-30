package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.request.MessageRequest;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.model.response.MessageResponse;
import com.example.distributed_chat_system.model.response.RoomListResponse;

public interface IRoomService {

    CreateRoomResponse createRoom(UserPrincipal userPrincipal, RoomCreateRequest request);

    RoomListResponse getRooms();

    void joinRoom(Long userId ,Long id);

    MessageResponse sendMessage(Long userId, MessageRequest request);
}
