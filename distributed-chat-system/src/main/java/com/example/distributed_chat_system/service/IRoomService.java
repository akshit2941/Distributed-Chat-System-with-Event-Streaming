package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.model.request.RoomCreateRequest;

public interface IRoomService {

    void createRoom(RoomCreateRequest request);
}
