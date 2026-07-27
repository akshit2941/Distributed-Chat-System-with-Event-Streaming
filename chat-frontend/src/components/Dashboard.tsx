import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldAlert, Cpu } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-card glass">
        <Cpu size={48} style={{ color: 'var(--accent-primary)', marginBottom: '15px' }} />
        <h2>Synapse Workspace</h2>
        
        <div className="user-badge">
          <div className="status-dot"></div>
          <span>Active Session</span>
        </div>

        <div className="dashboard-info">
          <div className="info-item">
            <span className="info-label">User ID:</span>
            <span className="info-value">{user?.userId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Username:</span>
            <span className="info-value">{user?.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Connection Status:</span>
            <span className="info-value" style={{ color: 'var(--success)', fontWeight: 'bold' }}>ONLINE</span>
          </div>
        </div>

        <div className="alert alert-danger" style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', textAlign: 'left' }}>
          <ShieldAlert size={24} style={{ flexShrink: 0 }} />
          <span>This is a secure session placeholder. Next, we will connect this user session to the rooms list and establish the Go WebSocket listener.</span>
        </div>

        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Disconnect Session</span>
        </button>
      </div>
    </div>
  );
};
