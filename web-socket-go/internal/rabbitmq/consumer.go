package rabbitmq

import (
	"encoding/json"
	"log"
	"os"
	"web-socket-go/internal/manager"
	"web-socket-go/internal/models"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Consumer struct {
	conn      *amqp.Connection
	channel   *amqp.Channel
	queueName string
	mgr       *manager.Manager
}

func NewConsumer(mgr *manager.Manager) *Consumer {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ for consumer:", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal("Failed to open a channel for consumer:", err)
	}

	// Ensure the fanout exchange exists
	err = ch.ExchangeDeclare(
		"chat_exchange", // name
		"fanout",        // type
		true,            // durable
		false,           // auto-deleted
		false,           // internal
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		log.Fatal("Failed to declare exchange for consumer:", err)
	}

	// Declare an exclusive, auto-delete, temporary queue
	q, err := ch.QueueDeclare(
		"",    // name (empty means server generates a random name)
		false, // durable
		true,  // delete when unused (auto-delete)
		true,  // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		log.Fatal("Failed to declare temporary queue for consumer:", err)
	}

	// Bind the queue to the exchange
	err = ch.QueueBind(
		q.Name,          // queue name
		"",              // routing key (ignored for fanout)
		"chat_exchange", // exchange name
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		log.Fatal("Failed to bind queue to exchange:", err)
	}

	return &Consumer{
		conn:      conn,
		channel:   ch,
		queueName: q.Name,
		mgr:       mgr,
	}
}

func (c *Consumer) Start() {
	msgs, err := c.channel.Consume(
		c.queueName, // queue
		"",          // consumer tag
		true,        // auto-ack
		false,       // exclusive
		false,       // no-local
		false,       // no-wait
		nil,         // args
	)
	if err != nil {
		log.Fatal("Failed to register consumer:", err)
	}

	go func() {
		for d := range msgs {
			var msg models.Message
			err := json.Unmarshal(d.Body, &msg)
			if err != nil {
				log.Println("Error unmarshaling message from RabbitMQ:", err)
				continue
			}

			// Broadcast to the correct room locally
			c.mgr.Broadcast(msg.RoomID, d.Body)
		}
	}()
}

func (c *Consumer) Close() {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
}
