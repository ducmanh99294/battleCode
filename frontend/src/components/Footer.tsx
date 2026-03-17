import React from 'react';
import '../assets/footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dungeon-footer">
      {/* Decorative top border */}
      <div className="footer-border">
        <div className="border-decoration"></div>
      </div>

      <div className="footer-content">
        {/* Left section - Game info */}
        <div className="footer-section">
          <div className="footer-logo">
            <span className="footer-logo-icon">⚔️</span>
            <span className="footer-logo-text">CODE DUNGEON</span>
            <span className="footer-logo-icon">🛡️</span>
          </div>
          <p className="footer-description">
            Nơi lập trình viên trở thành anh hùng,<br />
            chiến đấu với quái vật bằng code
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Discord">
              <span className="social-icon">🎮</span>
            </a>
            <a href="#" className="social-link" aria-label="GitHub">
              <span className="social-icon">💻</span>
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <span className="social-icon">🐦</span>
            </a>
            <a href="#" className="social-link" aria-label="Facebook">
              <span className="social-icon">📘</span>
            </a>
          </div>
        </div>

        {/* Middle section - Quick links */}
        <div className="footer-section">
          <h3 className="footer-title">Khám phá</h3>
          <ul className="footer-links">
            <li><a href="#">Dungeons</a></li>
            <li><a href="#">Classes</a></li>
            <li><a href="#">Spells</a></li>
            <li><a href="#">Quests</a></li>
            <li><a href="#">Guilds</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Hỗ trợ</h3>
          <ul className="footer-links">
            <li><a href="#">Hướng dẫn</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Báo lỗi</a></li>
            <li><a href="#">Liên hệ</a></li>
            <li><a href="#">Điều khoản</a></li>
          </ul>
        </div>

        {/* Right section - Stats & Newsletter */}
        <div className="footer-section">
          <h3 className="footer-title">Thống kê</h3>
          <div className="footer-stats">
            <div className="stat-row">
              <span className="stat-label">👥 Đang online:</span>
              <span className="stat-value">1,234</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">🏆 Trận hôm nay:</span>
              <span className="stat-value">5,678</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">📊 Tổng code:</span>
              <span className="stat-value">98,765</span>
            </div>
          </div>

          <div className="newsletter">
            <h4 className="newsletter-title">Nhận thông báo</h4>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Email của bạn" 
                className="newsletter-input"
              />
              <button className="newsletter-button">
                <span>📨</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="bottom-content">
          <div className="copyright">
            © {currentYear} Code Dungeon. All rights reserved.
          </div>
          <div className="bottom-links">
            <a href="#">Privacy Policy</a>
            <span className="separator">•</span>
            <a href="#">Terms of Service</a>
            <span className="separator">•</span>
            <a href="#">Cookie Policy</a>
          </div>
          <div className="version">
            <span className="version-badge">v2.0.1</span>
          </div>
        </div>
      </div>

      {/* Floating decoration */}
      <div className="footer-decoration">
        <div className="floating-sword">⚔️</div>
        <div className="floating-shield">🛡️</div>
        <div className="floating-potion">🧪</div>
      </div>
    </footer>
  );
};

export default Footer;