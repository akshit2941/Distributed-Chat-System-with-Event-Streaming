package com.example.distributed_chat_system.model.projection;

public interface RoomMemberCountProjection {
    Long getRoomId();
    Long getMemberCount();
}
