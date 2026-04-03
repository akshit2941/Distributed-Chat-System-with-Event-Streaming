package main

import (
	"fmt"
	"net/http"
	"web-socket-go/internal/manager"
	"web-socket-go/internal/rabbitmq"
	"web-socket-go/internal/ws"
)

var mgr = manager.NewManager()
var producer = rabbitmq.NewProducer()

func main() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.HandleWebSocket(mgr, producer, w, r)
	})

	fmt.Println("Server Started on port :8081")

	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		panic(err)
	}

}
