package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.projection.RoomMemberCountProjection;

import java.util.List;

public interface IRoomMemberService {
    RoomMember save(RoomMember roomMember);

    List<RoomMemberCountProjection> countMembersByRoomIds(List<Long> Ids);
}
