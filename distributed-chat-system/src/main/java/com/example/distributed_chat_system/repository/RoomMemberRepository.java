package com.example.distributed_chat_system.repository;

import com.example.distributed_chat_system.entity.RoomMember;
import com.example.distributed_chat_system.model.projection.RoomMemberCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    @Query("SELECT r.room AS roomId, COUNT(r) AS memberCount " +
            "FROM RoomMember r " +
            "WHERE r.room IN :roomIds " +
            "GROUP BY r.room")
    List<RoomMemberCountProjection> countMembersByRoomIds(@Param("roomIds") List<Long> roomIds);

}
