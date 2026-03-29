package com.example.distributed_chat_system.service.impl;

import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.projection.RoomMemberCountProjection;
import com.example.distributed_chat_system.repository.RoomMemberRepository;
import com.example.distributed_chat_system.service.IRoomMemberService;
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
}
