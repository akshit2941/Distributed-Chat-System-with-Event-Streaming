package main

import (
	"fmt"
	"net/http"
	"web-socket-go/internal/manager"
	"web-socket-go/internal/ws"
)

var mgr = manager.NewManager()

func main() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.HandleWebSocket(mgr, w, r)
	})

	fmt.Println("Server Started on port :8080")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic(err)
	}

}
