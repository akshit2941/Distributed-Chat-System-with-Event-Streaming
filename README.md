# Distributed Real-Time Chat System

A scalable, real-time chat system built using Go (WebSocket) and Spring Boot (Java) with RabbitMQ for asynchronous message processing.

---

## Architecture Overview

```
Frontend → Go (WebSocket Server) → RabbitMQ → Spring Boot → Database
```

---

## Services Breakdown

### Go Service

* Handles WebSocket connections
* Manages real-time communication
* Broadcasts messages instantly
* Publishes events to RabbitMQ

### RabbitMQ

* Acts as a message broker
* Decouples real-time layer and persistence layer
* Enables asynchronous processing

### Spring Boot Service

* Consumes messages from RabbitMQ
* Persists messages in database
* Provides REST APIs (e.g., chat history)

---

## Tech Stack

### Backend

* Go (WebSocket server)
* Spring Boot (Java)
* RabbitMQ

### Database

* MySQL / PostgreSQL (configurable)

### Messaging

* AMQP (RabbitMQ)

---

## Features Implemented

### Real-Time Messaging

* WebSocket-based communication
* Instant message delivery

### JWT Authentication

* Token-based authentication
* Identity verified at connection level

### Room-Based Chat

* Dynamic room joining via `JOIN` event
* Users can switch rooms

### Event-Based System

Supports:

* `MESSAGE`
* `JOIN`
* `LEAVE`
* `TYPING`

### Asynchronous Persistence

* Messages sent to RabbitMQ
* Stored via Spring Boot consumer

### Chat History API

* Fetch messages by room
* Pagination supported

---

## Message Flow

```
1. User sends message via WebSocket
2. Go server:
   → broadcasts to connected users
   → publishes message to RabbitMQ
3. Spring Boot:
   → consumes message
   → stores in database
```

---

## Authentication Flow

```
1. User logs in via Spring Boot
2. JWT is generated
3. Client connects:
   ws://localhost:8080/ws?token=JWT
4. Go server:
   → validates token
   → extracts userId
```

---

## Project Structure

### Go Service

```
go-chat-server/
│
├── cmd/
│   └── main.go
│
├── internal/
│   ├── ws/
│   ├── manager/
│   ├── models/
│   ├── rabbitmq/
│   └── utils/
```

---

### Spring Boot Service

```
src/main/java/
├── config/
├── consumer/
├── controller/
├── dto/
├── entity/
├── repository/
└── service/
```

---

## How to Run

### 1. Start RabbitMQ

```bash
docker run -d --name rabbitmq \
-p 5672:5672 \
-p 15672:15672 \
rabbitmq:3-management
```

Dashboard:
http://localhost:15672

---

### 2. Start Spring Boot

```bash
mvn spring-boot:run
```

---

### 3. Start Go Server

```bash
go run cmd/main.go
```

---

### 4. Connect WebSocket

```
ws://localhost:8080/ws?token=YOUR_JWT
```

---

## Sample Messages

### JOIN

```json
{
  "type": "JOIN",
  "roomId": "room1"
}
```

---

### MESSAGE

```json
{
  "type": "MESSAGE",
  "content": "Hello"
}
```

---

### TYPING

```json
{
  "type": "TYPING"
}
```

---

## Design Decisions

* WebSocket used for real-time communication
* RabbitMQ used for scalability and decoupling
* JWT used for stateless authentication
* Event-driven architecture for extensibility

---

## Future Improvements

* Read Receipts (DELIVERED / READ)
* Online/Offline Presence
* Multi-device support
* Horizontal scaling (multiple Go instances)
* Rate limiting
* Message retry and dead-letter queues

---

## Key Learning Outcomes

* Building real-time systems with WebSockets
* Designing distributed systems
* Using message brokers for async processing
* Managing state and concurrency in Go

---

This project is backend-focused. Frontend is intentionally not included.
