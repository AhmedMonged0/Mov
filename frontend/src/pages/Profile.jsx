import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="auth-container">
      <div className="auth-card profile-card">
        <div className="profile-header">
          <img src={user.avatar} alt={user.name} className="profile-avatar" />
          <div className="profile-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <span className="role-badge">{user.role}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e2029', paddingTop: '20px' }}>
          <h4>Account Details</h4>
          <p style={{ color: '#aaa', fontSize: '14px' }}>
            Member since: {new Date(user.createdAt || Date.now()).toLocaleDateString()}
          </p>
        </div>

        <button 
          onClick={logout} 
          className="auth-btn" 
          style={{ background: '#25262d', color: '#ff315a', marginTop: '20px' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
