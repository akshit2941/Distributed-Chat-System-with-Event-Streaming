package models

type Message struct {
	Type     string `json:"type"`     // MESSAGE, JOIN, etc.
	RoomID   string `json:"roomId"`   // which room
	SenderID int    `json:"senderId"` // who sent it
	Content  string `json:"content"`  // actual message
}
