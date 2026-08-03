import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Compass, Users, Hash, LogOut, X, RefreshCw } from 'lucide-react';
import './Sidebar.css';

interface Room {
  id: number;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  members: number;
  createdAt: string;
}

interface SidebarProps {
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  userMap: Record<number, string>;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRoomId, setActiveRoomId, userMap }) => {
  const { token, user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDmModal, setShowDmModal] = useState(false);
  
  // Create Room fields
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'GROUP' | 'PRIVATE'>('GROUP');
  const [createLoading, setCreateLoading] = useState(false);

  // Join Room fields
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchRooms = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8080/api/room/get', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to load rooms');
      }
      const data = await response.json();
      setRooms(data.roomDetailList || []);
    } catch (err: any) {
      setError(err.message || 'Error loading rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [token, activeRoomId]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !token) return;

    try {
      setCreateLoading(true);
      const response = await fetch('http://localhost:8080/api/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomName: roomName.trim(),
          type: roomType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      setRoomName('');
      setShowCreateModal(false);
      await fetchRooms();
      
      if (data.roomId) {
        setActiveRoomId(String(data.roomId));
      }
    } catch (err: any) {
      alert(err.message || 'Error creating room');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinRoomId.trim();
    if (!id || isNaN(Number(id)) || !token) return;

    try {
      setJoinLoading(true);
      setJoinError(null);
      
      const response = await fetch(`http://localhost:8080/api/room/join?id=${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to join room. Verify the Room ID.');
      }

      setJoinRoomId('');
      setShowJoinModal(false);
      await fetchRooms();
      setActiveRoomId(id);
    } catch (err: any) {
      setJoinError(err.message || 'Error joining room');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleStartDm = async (targetUserId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:8080/api/room/dm?targetUserId=${targetUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to start direct message');
      }
      const data = await response.json(); // { roomId: number, ... }
      setShowDmModal(false);
      await fetchRooms();
      setActiveRoomId(String(data.roomId));
    } catch (err: any) {
      alert(err.message || 'Error starting DM');
    }
  };

  const groupRooms = rooms.filter(r => r.type === 'GROUP');
  const dmRooms = rooms.filter(r => r.type === 'PRIVATE');

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <Hash size={20} />
          <span>Distributed Chat System</span>
        </h2>
        <button className="action-icon-btn" onClick={fetchRooms} title="Refresh lists">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="sidebar-scroll">
        {/* GROUP ROOMS */}
        <div className="section-label">
          <span>Chat Rooms ({groupRooms.length})</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="action-icon-btn" 
              onClick={() => setShowJoinModal(true)} 
              title="Join room by ID"
            >
              <Compass size={14} />
            </button>
            <button 
              className="action-icon-btn" 
              onClick={() => setShowCreateModal(true)} 
              title="Create new room"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {loading && rooms.length === 0 ? (
          <p style={{ padding: '0 8px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading rooms...</p>
        ) : error ? (
          <p style={{ padding: '0 8px', color: 'var(--danger)', fontSize: '13px' }}>{error}</p>
        ) : groupRooms.length === 0 ? (
          <p style={{ padding: '0 8px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>No chat rooms joined.</p>
        ) : (
          <div className="room-list" style={{ marginBottom: '16px' }}>
            {groupRooms.map((room) => {
              const isActive = activeRoomId === String(room.id);
              return (
                <button
                  key={room.id}
                  className={`room-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveRoomId(String(room.id))}
                >
                  <div className="room-info">
                    <Hash size={16} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    <span className="room-name">{room.name}</span>
                  </div>
                  <div className="room-meta">
                    <Users size={10} />
                    <span>{room.members}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* DIRECT MESSAGES */}
        <div className="section-label" style={{ marginTop: '8px' }}>
          <span>Direct Messages ({dmRooms.length})</span>
          <button 
            className="action-icon-btn" 
            onClick={() => setShowDmModal(true)} 
            title="Start direct message"
          >
            <Plus size={14} />
          </button>
        </div>

        {!loading && dmRooms.length === 0 ? (
          <p style={{ padding: '0 8px', color: 'var(--text-muted)', fontSize: '13px' }}>No active DMs.</p>
        ) : (
          <div className="room-list">
            {dmRooms.map((room) => {
              const isActive = activeRoomId === String(room.id);
              const displayName = room.name.split('_').find(name => name !== user?.username) || room.name;
              return (
                <button
                  key={room.id}
                  className={`room-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveRoomId(String(room.id))}
                >
                  <div className="room-info">
                    <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '10px', boxShadow: 'none' }}>
                      {displayName[0]}
                    </div>
                    <span className="room-name">{displayName}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.username?.[0] || 'U'}</div>
          <div className="user-details">
            <span className="user-name">{user?.username}</span>
            <span className="user-status">
              <span className="status-dot"></span>
              online
            </span>
          </div>
        </div>
        <button className="logout-icon-btn" onClick={logout} title="Log out">
          <LogOut size={16} />
        </button>
      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card glass">
            <div className="modal-header">
              <h3 className="modal-title">Create Chat Room</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="modal-form">
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="e.g. general-lounge" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select 
                  className="modal-select"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as any)}
                >
                  <option value="GROUP">Group Chat (Public/Multi-user)</option>
                  <option value="PRIVATE">Private Room (Direct Messaging)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-card glass">
            <div className="modal-header">
              <h3 className="modal-title">Join Existing Room</h3>
              <button className="modal-close-btn" onClick={() => setShowJoinModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoinRoom} className="modal-form">
              {joinError && <div className="alert alert-danger">{joinError}</div>}
              <div className="form-group">
                <label className="form-label">Room ID Number</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Enter numerical room ID" 
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={joinLoading}>
                  {joinLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* START DM MODAL */}
      {showDmModal && (
        <div className="modal-overlay">
          <div className="modal-card glass">
            <div className="modal-header">
              <h3 className="modal-title">New Conversation</h3>
              <button className="modal-close-btn" onClick={() => setShowDmModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-form">
              <label className="form-label" style={{ marginBottom: '4px' }}>Select a User</label>
              <div className="room-list" style={{ maxHeight: '250px', overflowY: 'auto', gap: '6px' }}>
                {Object.entries(userMap)
                  .map(([id, username]) => ({ id: Number(id), username }))
                  .filter((u) => u.id !== user?.userId)
                  .length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                      No other users registered.
                    </p>
                  ) : (
                    Object.entries(userMap)
                      .map(([id, username]) => ({ id: Number(id), username }))
                      .filter((u) => u.id !== user?.userId)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="room-item"
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}
                          onClick={() => handleStartDm(u.id)}
                        >
                          <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '12px', boxShadow: 'none' }}>
                            {u.username[0]}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.username}</span>
                        </button>
                      ))
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
