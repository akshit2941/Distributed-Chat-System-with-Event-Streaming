package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.config.CustomException;
import com.example.distributed_chat_system.entity.ChatRooms;
import com.example.distributed_chat_system.entity.Message;
import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.projection.RoomMemberCountProjection;
import com.example.distributed_chat_system.model.request.MessageRequest;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.model.response.MessageResponse;
import com.example.distributed_chat_system.model.response.RoomListResponse;
import com.example.distributed_chat_system.service.IChatRoomService;
import com.example.distributed_chat_system.service.IMessageService;
import com.example.distributed_chat_system.service.IRoomMemberService;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.distributed_chat_system.model.dto.MessageDto;
import com.example.distributed_chat_system.repository.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements IRoomService {

    private final IChatRoomService chatRoomService;
    private final IRoomMemberService roomMemberService;
    private final IMessageService messageService;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

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
                                        .id(room.getId())
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

    @Override
    public MessageResponse sendMessage(Long userId, MessageRequest request) {
        boolean isMember = roomMemberService.isMember(request.getRoomId(), userId);
        if (!isMember) {
            throw new CustomException("You are not a member of this chat room!");
        }

        MessageDto messageDto = MessageDto.builder()
                .type("MESSAGE")
                .roomId(String.valueOf(request.getRoomId()))
                .senderId(String.valueOf(userId))
                .content(request.getMessage())
                .iv(request.getIv())
                .encryptedKeys(request.getEncryptedKeys())
                .build();

        try {
            String messageJson = objectMapper.writeValueAsString(messageDto);
            rabbitTemplate.convertAndSend("chat_exchange", "", messageJson);
        } catch (Exception e) {
            throw new CustomException("Failed to send message over event stream: " + e.getMessage());
        }

        return MessageResponse.builder()
                .content(request.getMessage())
                .roomId(request.getRoomId())
                .senderId(userId)
                .iv(request.getIv())
                .encryptedKeys(request.getEncryptedKeys())
                .build();
    }

    @Override
    public List<MessageResponse> getMessageHistory(Long userId, Long roomId, int page, int size) {
        ChatRooms room = chatRoomService.getById(roomId);
        if (room == null) {
            throw new CustomException("Chat Room Not Found!");
        }

        boolean isMember = roomMemberService.isMember(roomId, userId);
        if (!isMember) {
            throw new CustomException("You are not a member of this chat room!");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Message> messagePage = messageService.getMessagesByRoom(roomId, pageable);

        return messagePage.getContent().stream()
                .map(msg -> MessageResponse.builder()
                        .messageId(msg.getId())
                        .content(msg.getContent())
                        .roomId(msg.getRoom())
                        .senderId(msg.getSender())
                        .iv(msg.getIv())
                        .encryptedKeys(msg.getEncryptedKeys())
                        .build())
                .toList();
    }

    @Override
    public Map<Long, String> getAllUsers() {
        return userRepository.findAll().stream()
                .collect(Collectors.toMap(
                        com.example.distributed_chat_system.entity.User::getId,
                        com.example.distributed_chat_system.entity.User::getUsername
                ));
    }

    @Override
    public CreateRoomResponse getOrCreateDmRoom(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new CustomException("Cannot start a direct message with yourself!");
        }

        List<Long> privateRooms = roomMemberService.findPrivateRoomsBetweenUsers(currentUserId, targetUserId);
        if (!privateRooms.isEmpty()) {
            Long existingRoomId = privateRooms.get(0);
            ChatRooms chatRooms = chatRoomService.getById(existingRoomId);
            return CreateRoomResponse.builder()
                    .roomId(existingRoomId)
                    .name(chatRooms.getName())
                    .type(chatRooms.getType())
                    .build();
        }

        com.example.distributed_chat_system.entity.User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomException("Current User not found"));
        com.example.distributed_chat_system.entity.User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomException("Target User not found"));

        ChatRooms newRoom = ChatRooms.builder()
                .name(currentUser.getUsername() + "_" + targetUser.getUsername())
                .type(com.example.distributed_chat_system.enums.ChatroomType.PRIVATE)
                .build();

        ChatRooms savedRoom = chatRoomService.save(newRoom);

        RoomMember currentMember = RoomMember.builder()
                .room(savedRoom.getId())
                .user(currentUserId)
                .build();
        roomMemberService.save(currentMember);

        RoomMember targetMember = RoomMember.builder()
                .room(savedRoom.getId())
                .user(targetUserId)
                .build();
        roomMemberService.save(targetMember);

        return CreateRoomResponse.builder()
                .roomId(savedRoom.getId())
                .name(savedRoom.getName())
                .type(savedRoom.getType())
                .build();
    }

    @Override
    public void leaveRoom(Long userId, Long roomId) {
        ChatRooms room = chatRoomService.getById(roomId);
        if (room == null) {
            throw new CustomException("Chat Room Not Found!");
        }
        boolean isMember = roomMemberService.isMember(roomId, userId);
        if (!isMember) {
            throw new CustomException("You are not a member of this room!");
        }
        roomMemberService.leaveRoom(roomId, userId);
    }

    @Override
    public List<Long> getRoomMembers(Long roomId) {
        return roomMemberService.getMemberIdsByRoomId(roomId);
    }
}
