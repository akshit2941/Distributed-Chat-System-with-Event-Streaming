import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'MESSAGE' | 'JOIN' | 'LEAVE' | 'TYPING';
  roomId: string;
  senderId: number;
  content: string;
}

export const useWebSocket = (
  token: string | null,
  activeRoomId: string | null,
  userMap: Record<number, string>
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    let socket: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      console.log('Connecting to WebSocket...');
      socket = new WebSocket(`ws://localhost:8081/ws?token=${token}`);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        if (activeRoomId) {
          socket.send(JSON.stringify({
            type: 'JOIN',
            roomId: activeRoomId
          }));
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
      };

      socket.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          
          if (msg.type === 'MESSAGE') {
            if (msg.roomId === activeRoomId) {
              setMessages((prev) => [
                ...prev,
                {
                  roomId: Number(msg.roomId),
                  senderId: msg.senderId,
                  content: msg.content,
                  senderUsername: userMap[msg.senderId] || `User #${msg.senderId}`
                }
              ]);
            }
          } else if (msg.type === 'TYPING') {
            if (msg.roomId === activeRoomId) {
              const username = userMap[msg.senderId] || `User #${msg.senderId}`;
              
              if (typingTimeoutRef.current[msg.senderId]) {
                clearTimeout(typingTimeoutRef.current[msg.senderId]);
              }

              setTypingUsers((prev) => {
                if (prev.includes(username)) return prev;
                return [...prev, username];
              });

              typingTimeoutRef.current[msg.senderId] = setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u !== username));
              }, 3000);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [token, activeRoomId, userMap]);

  // Join room when activeRoomId changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoomId) {
      wsRef.current.send(JSON.stringify({
        type: 'JOIN',
        roomId: activeRoomId
      }));
    }
    setTypingUsers([]);
    setMessages([]);
  }, [activeRoomId]);

  const sendTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoomId) {
      wsRef.current.send(JSON.stringify({
        type: 'TYPING',
        roomId: activeRoomId,
        content: 'TYPING'
      }));
    }
  }, [activeRoomId]);

  return {
    isConnected,
    messages,
    setMessages,
    typingUsers,
    sendTyping
  };
};
