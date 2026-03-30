package main

import (
	"fmt"
	"net/http"
	"web-socket-go/internal/ws"
)

func main() {
	http.HandleFunc("/ws", ws.HandleWebSocket)

	fmt.Println("Server Started on port :8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic(err)
	}
}
