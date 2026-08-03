import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<number, string>>({});

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserMap(data);
      }
    } catch (err) {
      console.error('Error fetching users map:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Refresh user cache every 20 seconds to capture newly registered users dynamically
    const interval = setInterval(fetchUsers, 20000);
    return () => clearInterval(interval);
  }, [token]);

  const {
    isConnected,
    messages,
    setMessages,
    typingUsers,
    sendTyping
  } = useWebSocket(token, activeRoomId, userMap);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar activeRoomId={activeRoomId} setActiveRoomId={setActiveRoomId} />
      <ChatArea
        activeRoomId={activeRoomId}
        websocketMessages={messages}
        setWebsocketMessages={setMessages}
        typingUsers={typingUsers}
        sendTyping={sendTyping}
        userMap={userMap}
        isConnected={isConnected}
      />
    </div>
  );
};
