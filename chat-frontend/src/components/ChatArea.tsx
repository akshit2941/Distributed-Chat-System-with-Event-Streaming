import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquareOff, Lock, UserPlus, Radio, LogOut, Users } from 'lucide-react';
import './ChatArea.css';

interface Message {
  roomId: number;
  senderId: number;
  content: string;
  senderUsername: string;
}

interface ChatAreaProps {
  activeRoomId: string | null;
  websocketMessages: Message[];
  setWebsocketMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  typingUsers: string[];
  sendTyping: () => void;
  userMap: Record<number, string>;
  isConnected: boolean;
  onLeaveRoom: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeRoomId,
  websocketMessages,
  setWebsocketMessages,
  typingUsers,
  sendTyping,
  userMap,
  isConnected,
  onLeaveRoom
}) => {
  const { token, user } = useAuth();
  const [text, setText] = useState('');
  const [roomName, setRoomName] = useState('');
  
  // Member/History state
  const [isMember, setIsMember] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [roomType, setRoomType] = useState<'GROUP' | 'PRIVATE'>('GROUP');
  const [members, setMembers] = useState<number[]>([]);
  const [showMembersPanel, setShowMembersPanel] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Fetch Room Name, History, and Members when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId || !token) return;

    const fetchHistoryAndDetails = async () => {
      try {
        setHistoryLoading(true);
        setIsMember(true);

        // Fetch room list first to resolve Room Name
        const listResponse = await fetch('http://localhost:8080/api/room/get', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const currentRoom = listData.roomDetailList?.find(
            (r: any) => String(r.id) === activeRoomId
          );
          if (currentRoom) {
            setRoomType(currentRoom.type);
            if (currentRoom.type === 'PRIVATE') {
              const displayName = currentRoom.name.split('_').find((name: string) => name !== user?.username) || currentRoom.name;
              setRoomName(displayName);
            } else {
              setRoomName(currentRoom.name);
            }
          } else {
            setRoomName(`Room #${activeRoomId}`);
            setRoomType('GROUP');
          }
        }

        // Fetch messages history
        const historyResponse = await fetch(
          `http://localhost:8080/api/room/${activeRoomId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!historyResponse.ok) {
          if (historyResponse.status === 403 || historyResponse.status === 404) {
            try {
              const errData = await historyResponse.json();
              if (errData.message && errData.message.toLowerCase().includes('not a member')) {
                setIsMember(false);
                setWebsocketMessages([]);
                return;
              }
            } catch (e) {
              // Ignore parsing error and throw generic error
            }
          }
          throw new Error('Failed to load chat history');
        }

        const historyData = await historyResponse.json();
        
        // Map historical messages to our UI structure
        const mappedHistory = historyData.map((msg: any) => ({
          roomId: Number(activeRoomId),
          senderId: msg.senderId,
          content: msg.content,
          senderUsername: userMap[msg.senderId] || `User #${msg.senderId}`
        }));

        setWebsocketMessages(mappedHistory);

        // Fetch room members
        const membersResponse = await fetch(
          `http://localhost:8080/api/room/${activeRoomId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }
      } catch (err: any) {
        console.error('Error fetching history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistoryAndDetails();
  }, [activeRoomId, token, userMap, user?.username, setWebsocketMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [websocketMessages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    // Broadcast typing events, debounced by 1.5 seconds
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1500) {
      sendTyping();
      lastTypingTimeRef.current = now;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeRoomId || !token) return;

    const messageContent = text.trim();
    setText(''); // Instant UI clear for fluidity

    try {
      const response = await fetch('http://localhost:8080/api/message/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: Number(activeRoomId),
          message: messageContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending message');
      setText(messageContent); // Restore text on failure
    }
  };

  const handleJoinRoom = async () => {
    if (!activeRoomId || !token) return;
    try {
      setJoinLoading(true);
      const response = await fetch(`http://localhost:8080/api/room/join?id=${activeRoomId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Could not join chat room');
      }

      setIsMember(true);
      
      // Fetch messages history
      const historyResponse = await fetch(
        `http://localhost:8080/api/room/${activeRoomId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const mappedHistory = historyData.map((msg: any) => ({
          roomId: Number(activeRoomId),
          senderId: msg.senderId,
          content: msg.content,
          senderUsername: userMap[msg.senderId] || `User #${msg.senderId}`
        }));
        setWebsocketMessages(mappedHistory);
      }

      // Fetch room members
      const membersResponse = await fetch(
        `http://localhost:8080/api/room/${activeRoomId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }
    } catch (err: any) {
      alert(err.message || 'Error joining room');
    } finally {
      setJoinLoading(false);
    }
  };

  const [leaveLoading, setLeaveLoading] = useState(false);

  const handleLeaveRoom = async () => {
    if (!activeRoomId || !token) return;
    const confirmMessage = roomType === 'PRIVATE'
      ? 'Are you sure you want to close this direct message conversation?'
      : 'Are you sure you want to leave this chat room?';

    if (!window.confirm(confirmMessage)) return;

    try {
      setLeaveLoading(true);
      const response = await fetch(`http://localhost:8080/api/room/leave?id=${activeRoomId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to leave room');
      }

      onLeaveRoom();
    } catch (err: any) {
      alert(err.message || 'Error leaving room');
    } finally {
      setLeaveLoading(false);
    }
  };

  if (!activeRoomId) {
    return (
      <div className="no-room-selected">
        <MessageSquareOff size={64} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
        <h2>Select a Chat Room</h2>
        <p>Choose a channel from the left sidebar or create one to start streaming events!</p>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="join-prompt-panel">
        <div className="join-prompt-card glass">
          <Lock size={48} style={{ color: 'var(--warning)', marginBottom: '10px' }} />
          <h3 className="join-prompt-title">Restricted Access</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
            You are currently viewing <strong style={{ color: 'var(--text-primary)' }}>#{roomName}</strong>. 
            You must join this room to view history and broadcast messages.
          </p>
          <button className="btn-primary" onClick={handleJoinRoom} disabled={joinLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={16} />
            <span>{joinLoading ? 'Joining Room...' : 'Join Chat Room'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-room-badge">{roomType === 'PRIVATE' ? '@' : '#'}</span>
          <h2 className="chat-room-title">{roomName}</h2>
          <div className="chat-room-status">
            <span>•</span>
            <span>Room ID: {activeRoomId}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`connection-pill ${isConnected ? '' : 'offline'}`}>
            <Radio size={14} className={isConnected ? 'pulsing' : ''} />
            <span>{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>
          {isMember && (
            <>
              <button
                className="action-icon-btn"
                onClick={() => setShowMembersPanel(!showMembersPanel)}
                title="Toggle Room Members"
                style={{
                  padding: '6px',
                  color: showMembersPanel ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  background: showMembersPanel ? 'rgba(88, 101, 242, 0.15)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Users size={16} />
              </button>
              <button
                className="action-icon-btn"
                onClick={handleLeaveRoom}
                disabled={leaveLoading}
                title={roomType === 'PRIVATE' ? 'Close Direct Message' : 'Leave Chat Room'}
                style={{
                  padding: '6px',
                  color: 'var(--danger)',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        {/* Main Feed Container */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
          <div className="chat-feed">
            {historyLoading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading message history...</p>
            ) : websocketMessages.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                <p>Welcome to the beginning of {roomType === 'PRIVATE' ? '@' : '#'}{roomName}!</p>
                <p style={{ fontSize: '12px' }}>Send a message to start streaming.</p>
              </div>
            ) : (
              websocketMessages.map((msg, index) => {
                const isSelf = msg.senderId === user?.userId;
                return (
                  <div key={index} className={`message-group ${isSelf ? 'self-message' : ''}`}>
                    {!isSelf && (
                      <div className="message-avatar">
                        {msg.senderUsername?.[0] || 'U'}
                      </div>
                    )}
                    <div className="message-content-wrapper">
                      <div className="message-meta">
                        <span className={`message-sender ${isSelf ? 'self' : ''}`}>
                          {isSelf ? 'You' : msg.senderUsername}
                        </span>
                        <span className="message-time">ID: {msg.senderId}</span>
                      </div>
                      <div className="message-bubble">{msg.content}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <div className="typing-indicator-bar">
              {typingUsers.length > 0 && (
                <>
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                  <span>
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </>
              )}
            </div>

            <form onSubmit={handleSend} className="chat-input-form">
              <div className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  placeholder={`Message ${roomType === 'PRIVATE' ? '@' : '#'}${roomName}`}
                  value={text}
                  onChange={handleInputChange}
                  disabled={!isConnected}
                  autoFocus
                />
              </div>
              <button type="submit" className="chat-send-btn" disabled={!text.trim() || !isConnected}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Collapsible Members List Sidebar */}
        {showMembersPanel && isMember && (
          <div className="members-sidebar glass" style={{
            width: '240px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            background: 'rgba(20, 20, 25, 0.45)',
            backdropFilter: 'blur(10px)',
            height: '100%',
            overflowY: 'auto'
          }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '16px',
              letterSpacing: '1px'
            }}>
              Members ({members.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(userId => {
                const username = userMap[userId] || `User #${userId}`;
                const isUserSelf = userId === user?.userId;
                return (
                  <div key={userId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: isUserSelf ? 'rgba(255, 255, 255, 0.04)' : 'transparent'
                  }}>
                    <div className="user-avatar" style={{
                      width: '24px',
                      height: '24px',
                      fontSize: '11px',
                      boxShadow: 'none',
                      flexShrink: 0
                    }}>
                      {username[0]?.toUpperCase()}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isUserSelf ? 'var(--accent-primary)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {username} {isUserSelf && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>(you)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
