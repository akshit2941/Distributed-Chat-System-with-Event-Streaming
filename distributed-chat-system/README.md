# Distributed Chat System Backend

This is the Spring Boot backend service. It is responsible for user authentication, chatroom management, persisting messages to MySQL, public key registry for E2EE, and calculating unread notifications.

## Key Features

- JWT Authentication.
- REST API for room history pagination and unread counts.
- RabbitMQ message listener to save broadcasted websocket messages to MySQL database.
