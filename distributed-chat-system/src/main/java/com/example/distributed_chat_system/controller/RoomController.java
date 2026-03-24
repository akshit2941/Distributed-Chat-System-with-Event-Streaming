package com.example.distributed_chat_system.controller;

import com.example.distributed_chat_system.model.request.RoomCreateRequest;
import com.example.distributed_chat_system.service.IRoomService;
import lombok.RequiredArgsConstructor;
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
    public void createRoom(@RequestBody RoomCreateRequest request){
        roomService.createRoom(request);
    }

}
