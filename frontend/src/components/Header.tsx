import React, { useState } from 'react';
import '../assets/header.css';
import { useNavigate } from 'react-router-dom';


const HomePage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Giả lập trạng thái login
  const nagvigate = useNavigate()
  return (
    <div className="header-container">
      {/* Background effect */}
      <div className="dungeon-bg"></div>
      
      {/* Main content */}
      <div className="content-wrapper">
        {/* Header with logo, user info, rank */}
        <header className="header">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo-icon">
                <span className="logo-sword">⚔️</span>
                <span className="logo-shield">🛡️</span>
              </div>
              <div className="logo-text">
                <span className="logo-title">CODE</span>
                <span className="logo-subtitle">DUNGEON</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            {isLoggedIn ? (
              // Logged in state
              <div className="user-info">
                <div className="rank-badge">
                  <span className="rank-icon">👑</span>
                  <span className="rank-level">Diamond</span>
                  <span className="rank-points">2540 pts</span>
                </div>
                
                <div className="user-profile">
                  <div className="user-details">
                    <span className="username">CodeMaster</span>
                    <span className="user-level">Level 42</span>
                  </div>
                  <div className="avatar-container">
                    <img 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster" 
                      alt="Avatar" 
                      className="avatar"
                    />
                    <span className="online-status"></span>
                  </div>
                </div>
              </div>
            ) : (
              // Logged out state
              <div className="auth-section">
                <button className="login-btn"
                onClick={() => {nagvigate("/login")}}
                >Đăng nhập</button>
                <button className="register-btn"
                onClick={() => {nagvigate("/register")}}
                >Đăng ký</button>
              </div>
            )}
          </div>
        </header>
      </div>
    </div>
  );
};

export default HomePage;