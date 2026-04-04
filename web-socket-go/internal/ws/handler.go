package ws

import (
	"encoding/json"
	"fmt"
	"net/http"
	"web-socket-go/internal/manager"
	"web-socket-go/internal/models"
	"web-socket-go/internal/rabbitmq"
	"web-socket-go/internal/utils"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(mgr *manager.Manager, producer *rabbitmq.Producer, w http.ResponseWriter, r *http.Request) {

	token := r.URL.Query().Get("token")
	if token == "" {
		fmt.Println("No token provided")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := utils.ValidateToken(token)
	if err != nil {
		fmt.Println("Invalid token")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	fmt.Println("Connected user:", userID)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade failed:", err)
		return
	}

	defer conn.Close()

	fmt.Println("New client connected")

	client := &models.Client{
		Conn:   conn,
		UserID: userID, // from JWT
		RoomID: "",
	}

	mgr.AddClient(client)
	defer mgr.RemoveClient(client)

	//infinite loop for messages to be kept reading
	for {
		_, messageBytes, err := conn.ReadMessage()
		if err != nil {
			mgr.RemoveClient(client)
			conn.Close()
			break
		}
		var msg models.Message
		err = json.Unmarshal(messageBytes, &msg)
		if err != nil {
			fmt.Println("Invalid message format")
			continue
		}

		msg.SenderID = client.UserID

		switch msg.Type {

		case "MESSAGE":
			data, _ := json.Marshal(msg)
			mgr.Broadcast(msg.RoomID, data)
			producer.Publish(data)

		case "JOIN":
			fmt.Println(msg.SenderID, "joined", msg.RoomID)

		case "LEAVE":
			fmt.Println(msg.SenderID, "left", msg.RoomID)

		case "TYPING":
			data, _ := json.Marshal(msg)
			mgr.Broadcast(msg.RoomID, data)

		default:
			fmt.Println("Unknown message type")
		}
	}
}
