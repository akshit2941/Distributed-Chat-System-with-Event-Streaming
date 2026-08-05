package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.request.MessageRequest;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.model.response.MessageResponse;
import com.example.distributed_chat_system.model.response.RoomListResponse;

import java.util.List;
import java.util.Map;

public interface IRoomService {

    CreateRoomResponse createRoom(UserPrincipal userPrincipal, RoomCreateRequest request);

    RoomListResponse getRooms(Long userId);

    void joinRoom(Long userId ,Long id);

    MessageResponse sendMessage(Long userId, MessageRequest request);

    List<MessageResponse> getMessageHistory(Long userId, Long roomId, int page, int size);

    Map<Long, String> getAllUsers();

    CreateRoomResponse getOrCreateDmRoom(Long currentUserId, Long targetUserId);

    void markRoomAsRead(Long userId, Long roomId);

    void leaveRoom(Long userId, Long roomId);

    List<Long> getRoomMembers(Long roomId);
}
