package com.example.distributed_chat_system.model.request;

import com.example.distributed_chat_system.enums.ChatroomType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomCreateRequest {
    private String roomName;
    private ChatroomType type;
}
