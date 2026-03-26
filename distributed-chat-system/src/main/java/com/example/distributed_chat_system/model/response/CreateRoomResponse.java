package com.example.distributed_chat_system.model.response;

import com.example.distributed_chat_system.enums.ChatroomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomResponse {
    private Long roomId;
    private String name;
    private ChatroomType type;
}
