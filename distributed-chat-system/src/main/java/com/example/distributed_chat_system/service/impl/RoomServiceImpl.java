package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.ChatRooms;
import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.service.IChatRoomService;
import com.example.distributed_chat_system.service.IRoomMemberService;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements IRoomService {

    private final IChatRoomService chatRoomService;
    private final IRoomMemberService roomMemberService;

    @Override
    public CreateRoomResponse createRoom(UserPrincipal userPrincipal, RoomCreateRequest request) {
        ChatRooms chatRooms = ChatRooms.builder()
                .name(request.getRoomName())
                .type(request.getType())
                .build();

        ChatRooms chatRoomsSavedEnity = chatRoomService.save(chatRooms);

        RoomMember roomMember = RoomMember.builder()
                .room(chatRoomsSavedEnity.getId())
                .user(userPrincipal.getUserId())
                .build();

        roomMemberService.save(roomMember);

        return  CreateRoomResponse.builder()
                .roomId(chatRoomsSavedEnity.getId())
                .name(request.getRoomName())
                .type(request.getType())
                .build();

    }
}
