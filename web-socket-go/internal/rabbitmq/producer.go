package rabbitmq

import (
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Producer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

func NewProducer() *Producer {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ:", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal("Failed to open a channel:", err)
	}

	// Declare exchange to ensure it exists
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
		log.Fatal("Failed to declare exchange for producer:", err)
	}

	return &Producer{
		conn:    conn,
		channel: ch,
	}
}

func (p *Producer) Publish(message []byte) {
	err := p.channel.Publish(
		"chat_exchange", // exchange name
		"",              // routing key (ignored for fanout)
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        message,
		},
	)

	if err != nil {
		log.Fatal("Failed to publish a message:", err)
	}
}
