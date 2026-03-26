package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;

public interface IRoomService {

    CreateRoomResponse createRoom(UserPrincipal userPrincipal, RoomCreateRequest request);
}
