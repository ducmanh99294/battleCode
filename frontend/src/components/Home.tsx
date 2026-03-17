import React, { useState } from 'react';
import '../assets/home.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-container">
      {/* Background effect */}
      <div className="dungeon-bg"></div>
      
      {/* Main content */}
      <div className="content-wrapper">
        {/* Header */}
        <header className="header">
          <h1 className="title">
            <span className="title-icon">⚔️</span>
            Code Dungeon
            <span className="title-icon">🗡️</span>
          </h1>
          <p className="subtitle">Nhập code để chiến đấu - Nơi lập trình viên trở thành anh hùng</p>
        </header>

        {/* Main menu cards */}
        <div className="menu-grid">
          {/* Play Dungeon Card */}
          <div className="menu-card play-card">
            <div className="card-glow"></div>
            <div className="card-content">
              <div className="card-icon">🎮</div>
              <h2 className="card-title">Play Dungeon</h2>
              <p className="card-description">
                Bắt đầu hành trình, nhập code và chiến đấu với quái vật
              </p>
              <div className="card-stats">
                <span>🏆 Đang chơi: 1,234</span>
                <span>⚡ Phòng chờ: 56</span>
              </div>
              <button className="play-button">
                <span>Vào chiến đấu</span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="menu-card leaderboard-card">
            <div className="card-content">
              <div className="card-icon">🏆</div>
              <h2 className="card-title">Leaderboard</h2>
              <p className="card-description">
                Bảng xếp hạng những lập trình viên xuất sắc nhất
              </p>
              
              {/* Preview top players */}
              <div className="preview-list">
                <div className="preview-item">
                  <span className="rank">#1</span>
                  <span className="player-name">CodeMaster</span>
                  <span className="player-score">9999</span>
                </div>
                <div className="preview-item">
                  <span className="rank">#2</span>
                  <span className="player-name">DevPro</span>
                  <span className="player-score">8750</span>
                </div>
                <div className="preview-item">
                  <span className="rank">#3</span>
                  <span className="player-name">BugHunter</span>
                  <span className="player-score">7600</span>
                </div>
              </div>
              
              <button className="menu-button">
                Xem bảng xếp hạng
              </button>
            </div>
          </div>

          {/* Match History Card */}
          <div className="menu-card history-card">
            <div className="card-content">
              <div className="card-icon">📜</div>
              <h2 className="card-title">Match History</h2>
              <p className="card-description">
                Lịch sử các trận đấu và thành tích của bạn
              </p>
              
              {/* Recent matches preview */}
              <div className="preview-list">
                <div className="history-item">
                  <span className="match-result victory">🏆 Thắng</span>
                  <span className="match-dungeon">Rừng Tối</span>
                  <span className="match-time">2 phút trước</span>
                </div>
                <div className="history-item">
                  <span className="match-result defeat">💀 Thua</span>
                  <span className="match-dungeon">Hang Rồng</span>
                  <span className="match-time">15 phút trước</span>
                </div>
                <div className="history-item">
                  <span className="match-result victory">🏆 Thắng</span>
                  <span className="match-dungeon">Tháp Phù Thủy</span>
                  <span className="match-time">1 giờ trước</span>
                </div>
              </div>
              
              <button className="menu-button">
                Xem lịch sử
              </button>
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <footer className="footer">
          <div className="stat-item">
            <span className="stat-value">12,345</span>
            <span className="stat-label">Lập trình viên</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">98,765</span>
            <span className="stat-label">Trận đấu</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">4,567</span>
            <span className="stat-label">Code đã nộp</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;