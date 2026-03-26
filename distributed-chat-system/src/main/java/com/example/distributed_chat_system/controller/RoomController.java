package com.example.distributed_chat_system.controller;

import com.example.distributed_chat_system.annotations.CurrentUser;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {

    private final IRoomService roomService;

    @PostMapping("/room/create")
    public ResponseEntity<CreateRoomResponse> createRoom(@CurrentUser UserPrincipal userPrincipal, @RequestBody RoomCreateRequest request){
        return ResponseEntity.ok(roomService.createRoom(userPrincipal,request));
    }

}
