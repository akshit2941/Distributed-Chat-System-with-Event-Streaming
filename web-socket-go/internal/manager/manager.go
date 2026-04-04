package manager

import (
	"fmt"
	"sync"
	"web-socket-go/internal/models"
)

type Manager struct {
	Clients map[int]*models.Client
	Rooms   map[string]map[int]*models.Client

	//to maintain race conditions
	mu sync.Mutex
}

func NewManager() *Manager {
	return &Manager{
		Clients: make(map[int]*models.Client),
		Rooms:   make(map[string]map[int]*models.Client),
	}
}

func (m *Manager) AddClient(client *models.Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	//add to global clients map
	m.Clients[client.UserID] = client

	//if room do not exist then create
	if _, exists := m.Rooms[client.RoomID]; !exists {
		m.Rooms[client.RoomID] = make(map[int]*models.Client)
	}

	//add the user
	m.Rooms[client.RoomID][client.UserID] = client
}

func (m *Manager) RemoveClient(client *models.Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	//remove from global client
	delete(m.Clients, client.UserID)

	if room, exists := m.Rooms[client.RoomID]; exists {
		delete(room, client.UserID)

		//if room empty del that too
		if len(room) == 0 {
			delete(m.Rooms, client.RoomID)
		}
	}
}

func (m *Manager) Broadcast(roomID string, message []byte) {
	m.mu.Lock()
	defer m.mu.Unlock()

	clients, exists := m.Rooms[roomID]
	if !exists {
		return
	}

	fmt.Println("Total users:", len(clients))
	fmt.Println("Broadcasting to room:", roomID)

	for _, clients := range clients {
		clients.Conn.WriteMessage(1, message)

	}
}
