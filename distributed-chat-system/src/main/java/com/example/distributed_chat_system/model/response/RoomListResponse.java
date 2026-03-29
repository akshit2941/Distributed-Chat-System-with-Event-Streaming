package com.example.distributed_chat_system.model.response;

import com.example.distributed_chat_system.enums.ChatroomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomListResponse {

    private List<RoomDetail> roomDetailList;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomDetail {
        private String name;
        private ChatroomType type;
        private Long members;
        private String createdAt;
    }
}
