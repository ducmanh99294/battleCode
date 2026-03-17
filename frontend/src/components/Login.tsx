import '../assets/login.css';
import React, { useState } from 'react';
import '../assets/login.css';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLoginSuccess?: (userData: any) => void;
  onClose?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const navigete = useNavigate()

  // Xử lý đăng nhập Google
  const handleGoogleLogin = () => {
    // Mock Google Login - Thực tế sẽ tích hợp với Firebase hoặc OAuth
    console.log('Google login clicked');
    
    // Giả lập đăng nhập thành công
    const mockUserData = {
      id: 'google-123456',
      email: 'user@gmail.com',
      name: 'Nguyễn Văn A',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google-user',
      provider: 'google'
    };
    
    if (onLoginSuccess) {
      onLoginSuccess(mockUserData);
    }
  };

  // Xử lý đăng nhập thường
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Xử lý đăng nhập
      console.log('Login with:', { email, password, rememberMe });
      
      // Mock login success
      const mockUserData = {
        id: 'user-123',
        email,
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        provider: 'local'
      };
      
      if (onLoginSuccess) {
        onLoginSuccess(mockUserData);
      }
    } else {
      // Xử lý đăng ký
      if (password !== confirmPassword) {
        alert('Mật khẩu không khớp!');
        return;
      }
      
      if (!agreeTerms) {
        alert('Vui lòng đồng ý với điều khoản!');
        return;
      }
      
      console.log('Register with:', { email, password });
      
      // Mock register success
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      setIsLogin(true);
    }
  };

  return (
    <div className="login-container">
      {/* Background dungeon effect */}
      <div className="login-bg">
        <div className="dungeon-wall"></div>
        <div className="floating-runes">
          <span>⚔️</span>
          <span>🛡️</span>
          <span>🏰</span>
          <span>🗡️</span>
          <span>🔮</span>
          <span>⚡</span>
        </div>
      </div>

      {/* Login card */}
      <div className="login-card">
        {/* Close button */}
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <span className="close-icon">✕</span>
          </button>
        )}

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-sword">⚔️</span>
            <h1 className="logo-text">CODE DUNGEON</h1>
            <span className="logo-shield">🛡️</span>
          </div>
          <p className="login-subtitle">
            {isLogin ? 'Đăng nhập để tiếp tục hành trình' : 'Tạo tài khoản anh hùng mới'}
          </p>
        </div>

        {/* Main form */}
        <div className="login-form-wrapper">
          {/* Google login button */}
          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <div className="google-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <span className="google-text">Đăng nhập với Google</span>
          </button>

          {/* Divider */}
          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">hoặc</span>
            <span className="divider-line"></span>
          </div>

          {/* Email/Password form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="label-icon">📧</span>
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="label-icon">🔒</span>
                Mật khẩu
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-text">Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="forgot-password">Quên mật khẩu?</a>
              </div>
            )}

            {!isLogin && (
              <div className="terms-checkbox">
                <label className="terms-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="terms-text">
                    Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
                  </span>
                </label>
              </div>
            )}

            <button type="submit" className="submit-btn">
              <span className="btn-icon">{isLogin ? '⚔️' : '📜'}</span>
              <span className="btn-text">
                {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
              </span>
              <span className="btn-glow"></span>
            </button>
          </form>

          {/* Switch between login/register */}
          <div className="switch-auth">
            <p>
              {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              <button
                className="switch-btn"
                onClick={() => navigete("/register")}
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>
        </div>

        {/* Dungeon rules */}
        <div className="dungeon-rules">
          <div className="rule-item">
            <span className="rule-icon">⚔️</span>
            <span className="rule-text">Code để chiến đấu</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">🛡️</span>
            <span className="rule-text">Bảo vệ guild</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">🏆</span>
            <span className="rule-text">Leo rank mỗi ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;