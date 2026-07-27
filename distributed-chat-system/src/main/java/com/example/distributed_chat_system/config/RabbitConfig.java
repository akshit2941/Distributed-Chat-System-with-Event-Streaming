package com.example.distributed_chat_system.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public FanoutExchange chatExchange() {
        return new FanoutExchange("chat_exchange", true, false);
    }

    @Bean
    public Queue chatQueue(){
        return new Queue("chat_queue", true);
    }

    @Bean
    public Binding binding(Queue chatQueue, FanoutExchange chatExchange) {
        return BindingBuilder.bind(chatQueue).to(chatExchange);
    }
}
