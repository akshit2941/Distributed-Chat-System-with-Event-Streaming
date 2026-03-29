package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.config.CustomException;
import com.example.distributed_chat_system.entity.ChatRooms;
import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.projection.RoomMemberCountProjection;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.model.response.RoomListResponse;
import com.example.distributed_chat_system.service.IChatRoomService;
import com.example.distributed_chat_system.service.IRoomMemberService;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        return CreateRoomResponse.builder()
                .roomId(chatRoomsSavedEnity.getId())
                .name(request.getRoomName())
                .type(request.getType())
                .build();

    }

    @Override
    public RoomListResponse getRooms() {
        List<ChatRooms> chatRooms = chatRoomService.getAll();

        List<Long> chatRoomsId = chatRooms.stream()
                .map(ChatRooms::getId)
                .distinct()
                .toList();

        Map<Long, Long> roomMemberCountMap = roomMemberService
                .countMembersByRoomIds(chatRoomsId)
                .stream()
                .collect(Collectors.toMap(
                        RoomMemberCountProjection::getRoomId,
                        RoomMemberCountProjection::getMemberCount
                ));


        return RoomListResponse.builder()
                .roomDetailList(
                        chatRooms.stream()
                                .map(room -> RoomListResponse.RoomDetail.builder()
                                        .name(room.getName())
                                        .type(room.getType())
                                        .members(roomMemberCountMap.getOrDefault(room.getId(), 0L))
                                        .createdAt(String.valueOf(room.getCreatedAt()))
                                        .build()
                                )
                                .toList()

                )
                .build();
    }

    @Override
    public void joinRoom(Long userId,Long id) {
        ChatRooms chatRooms = chatRoomService.getById(id);
        if(chatRooms==null){
            throw new CustomException("Chat Room Not Found!");
        }
        RoomMember roomMember = RoomMember.builder()
                .room(chatRooms.getId())
                .user(userId)
                .build();

        roomMemberService.save(roomMember);
    }
}
