package ws

import (
	"fmt"
	"net/http"
	"web-socket-go/internal/manager"
	"web-socket-go/internal/models"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(mgr *manager.Manager, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade failed:", err)
		return
	}
	defer conn.Close()

	fmt.Println("New client connected")

	client := &models.Client{
		Conn:   conn,
		UserID: "user1", // temporary
		RoomID: "room1",
	}

	mgr.AddClient(client)
	defer mgr.RemoveClient(client)

	//infinite loop for messages to be kept reading
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Client disconnected")
			break
		}

		fmt.Println("Recieved:", string(message))

		// broadcast instead of echo
		mgr.Broadcast(client.RoomID, message)

		err = conn.WriteMessage(messageType, message)
		if err != nil {
			fmt.Println("Write error:", err)
			break
		}
	}
}
