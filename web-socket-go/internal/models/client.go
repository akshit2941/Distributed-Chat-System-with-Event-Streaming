package models

import "github.com/gorilla/websocket"

type Client struct {
	UserID string
	Conn   *websocket.Conn
	RoomID string
}
