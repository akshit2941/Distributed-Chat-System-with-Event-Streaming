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

    boolean existsByRoomAndUser(Long room, Long user);

    @Query("SELECT rm1.room " +
           "FROM RoomMember rm1, RoomMember rm2, ChatRooms cr " +
           "WHERE rm1.room = rm2.room AND rm1.room = cr.id " +
           "AND rm1.user = :user1 AND rm2.user = :user2 AND cr.type = :type")
    List<Long> findPrivateRoomsBetweenUsers(@Param("user1") Long user1, @Param("user2") Long user2, @Param("type") com.example.distributed_chat_system.enums.ChatroomType type);
}
