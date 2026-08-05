import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquareOff, Lock, UserPlus, Radio, LogOut, Users } from 'lucide-react';
import { encryptMessageForUsers, decryptMessage } from '../utils/cryptoUtils';
import './ChatArea.css';

interface Message {
  roomId: number;
  senderId: number;
  content: string;
  senderUsername: string;
  iv?: string;
  encryptedKeys?: string;
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
  onMarkRead?: () => void;
}

// Subcomponent to handle asynchronous E2EE decryption
interface DecryptedMessageBubbleProps {
  content: string;
  iv?: string;
  encryptedKeys?: string;
  userId?: number;
  username?: string;
}

const DecryptedMessageBubble: React.FC<DecryptedMessageBubbleProps> = ({
  content,
  iv,
  encryptedKeys,
  userId,
  username
}) => {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Plain text message (e.g. public group channel)
    if (!iv || !encryptedKeys || !userId) {
      setDecryptedText(content);
      return;
    }

    const performDecryption = async () => {
      try {
        const keysMap = JSON.parse(encryptedKeys);
        const encryptedKeyForSelf = keysMap[String(userId)];

        if (!encryptedKeyForSelf) {
          setError(true);
          return;
        }

        const privateKeyJson = localStorage.getItem(`e2ee_private_key_${username}`);
        if (!privateKeyJson) {
          setError(true);
          return;
        }

        const decrypted = await decryptMessage(content, iv, encryptedKeyForSelf, privateKeyJson);
        setDecryptedText(decrypted);
      } catch (err) {
        console.error('Decryption error:', err);
        setError(true);
      }
    };

    performDecryption();
  }, [content, iv, encryptedKeys, userId]);

  if (error) {
    return (
      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🔐 Encrypted message (Decryption key missing or failed)
      </span>
    );
  }

  if (decryptedText === null) {
    return <span style={{ color: 'var(--text-muted)' }}>Decrypting...</span>;
  }

  return <span>{decryptedText}</span>;
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeRoomId,
  websocketMessages,
  setWebsocketMessages,
  typingUsers,
  sendTyping,
  userMap,
  isConnected,
  onLeaveRoom,
  onMarkRead
}) => {
  const { token, user } = useAuth();
  const [text, setText] = useState('');
  const [roomName, setRoomName] = useState('');
  
  // Member/History state
  const [isMember, setIsMember] = useState(true);

  const markAsRead = async () => {
    if (!token || !activeRoomId) return;
    try {
      const response = await fetch(`http://localhost:8080/api/room/${activeRoomId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        if (onMarkRead) onMarkRead();
      }
    } catch (err) {
      console.error('Error marking room as read:', err);
    }
  };

  useEffect(() => {
    if (activeRoomId) {
      markAsRead();
    }
  }, [activeRoomId]);

  useEffect(() => {
    if (websocketMessages.length > 0) {
      const lastMsg = websocketMessages[websocketMessages.length - 1];
      if (lastMsg.senderId !== user?.userId) {
        markAsRead();
      }
    }
  }, [websocketMessages]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [roomType, setRoomType] = useState<'GROUP' | 'PRIVATE'>('GROUP');
  const [members, setMembers] = useState<number[]>([]);
  const [showMembersPanel, setShowMembersPanel] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // E2EE states
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  const prevLengthRef = useRef(websocketMessages.length);

  // Fetch Room Name, History, and Members when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId || !token) return;

    // Reset pagination and E2EE states on room switch
    setPage(0);
    setHasMore(true);
    setLoadingMore(false);
    setRecipientPublicKey(null);

    const fetchHistoryAndDetails = async () => {
      try {
        setHistoryLoading(true);
        setIsMember(true);

        let currentRoomObj: any = null;

        // Fetch room list first to resolve Room Name
        const listResponse = await fetch('http://localhost:8080/api/room/get', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (listResponse.ok) {
          const listData = await listResponse.json();
          currentRoomObj = listData.roomDetailList?.find(
            (r: any) => String(r.id) === activeRoomId
          );
          if (currentRoomObj) {
            setRoomType(currentRoomObj.type);
            if (currentRoomObj.type === 'PRIVATE') {
              const displayName = currentRoomObj.name.split('_').find((name: string) => name !== user?.username) || currentRoomObj.name;
              setRoomName(displayName);
            } else {
              setRoomName(currentRoomObj.name);
            }
          } else {
            setRoomName(`Room #${activeRoomId}`);
            setRoomType('GROUP');
          }
        }

        // Fetch messages history page 0, size 20
        const historyResponse = await fetch(
          `http://localhost:8080/api/room/${activeRoomId}/messages?page=0&size=20`,
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
        if (historyData.length < 20) {
          setHasMore(false);
        }
        
        // Map historical messages to our UI structure
        const mappedHistory = historyData.map((msg: any) => ({
          roomId: Number(activeRoomId),
          senderId: msg.senderId,
          content: msg.content,
          senderUsername: userMap[msg.senderId] || `User #${msg.senderId}`,
          iv: msg.iv,
          encryptedKeys: msg.encryptedKeys
        }));

        // Reverse because page 0 returns DESC, but we render chronologically (oldest at top)
        const reversed = [...mappedHistory].reverse();
        setWebsocketMessages(reversed);

        // Fetch room members
        const membersResponse = await fetch(
          `http://localhost:8080/api/room/${activeRoomId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (membersResponse.ok) {
          const membersData: number[] = await membersResponse.json();
          setMembers(membersData);

          // If PRIVATE room, fetch recipient public key for encryption
          if (currentRoomObj && currentRoomObj.type === 'PRIVATE') {
            const recipientId = membersData.find((m) => m !== user?.userId);
            if (recipientId) {
              const pkResponse = await fetch(`http://localhost:8080/api/user/${recipientId}/public-key`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (pkResponse.ok) {
                const pkData = await pkResponse.json();
                setRecipientPublicKey(pkData.publicKey);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistoryAndDetails();
  }, [activeRoomId, token, userMap, user?.username, setWebsocketMessages, user?.userId]);

  // Auto-scroll to bottom of messages only on initial load or new incoming messages
  useEffect(() => {
    const prevLength = prevLengthRef.current;
    prevLengthRef.current = websocketMessages.length;

    // Scroll if a single new message is added or it is initial load
    if (websocketMessages.length === prevLength + 1 || page === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [websocketMessages, typingUsers, page]);

  const loadMoreMessages = async () => {
    if (!token || !activeRoomId || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const container = feedRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;
      const prevScrollTop = container ? container.scrollTop : 0;

      const response = await fetch(
        `http://localhost:8080/api/room/${activeRoomId}/messages?page=${nextPage}&size=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const historyData = await response.json();

        if (historyData.length < 20) {
          setHasMore(false);
        }

        const mapped = historyData.map((msg: any) => ({
          roomId: Number(activeRoomId),
          senderId: msg.senderId,
          content: msg.content,
          senderUsername: userMap[msg.senderId] || `User #${msg.senderId}`,
          iv: msg.iv,
          encryptedKeys: msg.encryptedKeys
        }));

        const reversed = [...mapped].reverse();
        
        // Prepend older messages
        setWebsocketMessages((prev) => [...reversed, ...prev]);
        setPage(nextPage);

        // Adjust scroll position on next tick to prevent jump
        setTimeout(() => {
          if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight - prevScrollHeight + prevScrollTop;
          }
        }, 0);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = feedRef.current;
    if (!container || historyLoading || loadingMore || !hasMore) return;

    // Load more when scrolled close to the top
    if (container.scrollTop < 15) {
      loadMoreMessages();
    }
  };

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

    let bodyPayload: any = {
      roomId: Number(activeRoomId),
      message: messageContent
    };

    // Apply E2EE envelope encryption if in a Direct Message channel
    if (roomType === 'PRIVATE') {
      const selfPublicKey = localStorage.getItem(`e2ee_public_key_${user?.username}`);
      const recipientId = members.find((m) => m !== user?.userId);

      if (selfPublicKey && recipientPublicKey && recipientId) {
        try {
          const encrypted = await encryptMessageForUsers(
            messageContent,
            selfPublicKey,
            recipientPublicKey,
            user!.userId,
            recipientId
          );
          bodyPayload = {
            roomId: Number(activeRoomId),
            message: encrypted.ciphertext,
            iv: encrypted.iv,
            encryptedKeys: encrypted.encryptedKeys
          };
        } catch (err) {
          console.error('E2EE encryption error:', err);
          alert('Could not encrypt message. Sending aborted.');
          setText(messageContent);
          return;
        }
      } else {
        console.warn('Recipient public key missing. Falling back to plain text.');
      }
    }

    try {
      const response = await fetch('http://localhost:8080/api/message/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
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
        `http://localhost:8080/api/room/${activeRoomId}/messages?page=0&size=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.length < 20) {
          setHasMore(false);
        }
        const mappedHistory = historyData.map((msg: any) => ({
          roomId: Number(activeRoomId),
          senderId: msg.senderId,
          content: msg.content,
          senderUsername: userMap[msg.senderId] || `User #${msg.senderId}`,
          iv: msg.iv,
          encryptedKeys: msg.encryptedKeys
        }));
        const reversed = [...mappedHistory].reverse();
        setWebsocketMessages(reversed);
      }

      // Fetch room members
      const membersResponse = await fetch(
        `http://localhost:8080/api/room/${activeRoomId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (membersResponse.ok) {
        const membersData: number[] = await membersResponse.json();
        setMembers(membersData);

        if (roomType === 'PRIVATE') {
          const recipientId = membersData.find((m) => m !== user?.userId);
          if (recipientId) {
            const pkResponse = await fetch(`http://localhost:8080/api/user/${recipientId}/public-key`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (pkResponse.ok) {
              const pkData = await pkResponse.json();
              setRecipientPublicKey(pkData.publicKey);
            }
          }
        }
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
            {roomType === 'PRIVATE' && (
              <>
                <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>|</span>
                <span style={{ color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 600 }}>🔐 END-TO-END ENCRYPTED</span>
              </>
            )}
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
          <div className="chat-feed" ref={feedRef} onScroll={handleScroll}>
            {loadingMore && (
              <p style={{
                color: 'var(--accent-primary)',
                textAlign: 'center',
                fontSize: '12px',
                padding: '8px 0',
                margin: 0,
                background: 'rgba(255, 255, 255, 0.01)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
              }}>
                Loading older messages...
              </p>
            )}
            
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
                      <div className="message-bubble">
                        <DecryptedMessageBubble
                          content={msg.content}
                          iv={msg.iv}
                          encryptedKeys={msg.encryptedKeys}
                          userId={user?.userId}
                          username={user?.username}
                        />
                      </div>
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
