package com.example.distributed_chat_system.service;

import com.example.distributed_chat_system.entity.RoomMember;

public interface IRoomMemberService {
    RoomMember save(RoomMember roomMember);
}
