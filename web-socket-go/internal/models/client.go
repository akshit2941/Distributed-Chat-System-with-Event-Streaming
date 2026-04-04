package models

import "github.com/gorilla/websocket"

type Client struct {
	UserID int
	Conn   *websocket.Conn
	RoomID string
}
