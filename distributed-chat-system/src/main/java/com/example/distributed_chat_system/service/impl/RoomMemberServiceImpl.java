package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.projection.RoomMemberCountProjection;
import com.example.distributed_chat_system.repository.RoomMemberRepository;
import com.example.distributed_chat_system.service.IRoomMemberService;
import com.example.distributed_chat_system.enums.ChatroomType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomMemberServiceImpl implements IRoomMemberService {

    private final RoomMemberRepository roomMemberRepository;

    @Override
    public RoomMember save(RoomMember roomMember){
        return roomMemberRepository.save(roomMember);
    }

    @Override
    public List<RoomMemberCountProjection> countMembersByRoomIds(List<Long> Ids){
        return roomMemberRepository.countMembersByRoomIds(Ids);
    }

    @Override
    public boolean isMember(Long roomId, Long userId) {
        return roomMemberRepository.existsByRoomAndUser(roomId, userId);
    }

    @Override
    public List<Long> findPrivateRoomsBetweenUsers(Long user1, Long user2) {
        return roomMemberRepository.findPrivateRoomsBetweenUsers(user1, user2, ChatroomType.PRIVATE);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void leaveRoom(Long roomId, Long userId) {
        roomMemberRepository.deleteByRoomAndUser(roomId, userId);
    }

    @Override
    public List<Long> getMemberIdsByRoomId(Long roomId) {
        return roomMemberRepository.findByRoom(roomId).stream()
                .map(RoomMember::getUser)
                .toList();
    }
}
