package com.example.distributed_chat_system.consumer;

import com.example.distributed_chat_system.entity.Message;
import com.example.distributed_chat_system.model.dto.MessageDto;
import com.example.distributed_chat_system.service.IMessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageConsumer {
    private final IMessageService messageService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "chat_queue")
    public void consume(String messageJson){
        try{
            MessageDto messageDto =  objectMapper.readValue(messageJson, MessageDto.class);
            if (!"MESSAGE".equals(messageDto.getType())){
                return;
            }

            // Convert DTO → Entity
            Message message = Message.builder()
                    .room(Long.valueOf(messageDto.getRoomId()))
                    .sender(Long.valueOf(messageDto.getSenderId()))
                    .content(messageDto.getContent())
                    .build();

            messageService.save(message);
            log.info("Message saved for sender={} | message={}", messageDto.getSenderId(), messageDto.getContent());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
