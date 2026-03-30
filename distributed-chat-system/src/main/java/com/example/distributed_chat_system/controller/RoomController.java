package com.example.distributed_chat_system.controller;

import com.example.distributed_chat_system.annotations.CurrentUser;
import com.example.distributed_chat_system.model.dto.UserPrincipal;
import com.example.distributed_chat_system.model.request.MessageRequest;
import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.model.response.CreateRoomResponse;
import com.example.distributed_chat_system.model.response.MessageResponse;
import com.example.distributed_chat_system.model.response.RoomListResponse;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/room/get")
    public ResponseEntity<RoomListResponse> getRooms(@CurrentUser UserPrincipal userPrincipal){
        return ResponseEntity.ok(roomService.getRooms());
    }

    @PostMapping("/room/join")
    public void joinChatRoom(@CurrentUser UserPrincipal userPrincipal, @RequestParam(required = true) Long id){
        roomService.joinRoom(userPrincipal.getUserId(),id);
        ResponseEntity.ok();
    }

    @PostMapping("/message/send")
    public ResponseEntity<MessageResponse> sendMessage(@CurrentUser UserPrincipal userPrincipal, @RequestBody MessageRequest request){
        return ResponseEntity.ok(roomService.sendMessage(userPrincipal.getUserId(), request));
    }

}
