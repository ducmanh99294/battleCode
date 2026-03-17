import React, { useState } from 'react';
import '../assets/register.css';
import { useNavigate } from 'react-router-dom';

interface RegisterPageProps {
  onRegisterSuccess?: (userData: any) => void;
  onSwitchToLogin?: () => void;
  onClose?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onRegisterSuccess, 
  onSwitchToLogin,
  onClose 
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    characterName: '',
    class: 'warrior', // warrior, mage, archer, rogue
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [receiveNewsletter, setReceiveNewsletter] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1: account, 2: character
  const [isLoading, setIsLoading] = useState(false);

  const navigete = useNavigate()
  // Character classes
  const characterClasses = [
    { id: 'warrior', name: 'Chiến Binh', icon: '⚔️', color: '#ff4444', description: 'Tấn công mạnh mẽ, phòng thủ cao' },
    { id: 'mage', name: 'Pháp Sư', icon: '🔮', color: '#4444ff', description: 'Sát thương phép thuật, tấn công tầm xa' },
    { id: 'archer', name: 'Cung Thủ', icon: '🏹', color: '#44ff44', description: 'Tốc độ cao, chí mạng' },
    { id: 'rogue', name: 'Sát Thủ', icon: '🗡️', color: '#ff44ff', description: 'Ẩn thân, sát thương lớn' },
  ];

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (registerStep === 1) {
      if (!formData.username) {
        newErrors.username = 'Tên đăng nhập không được để trống';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
      }

      if (!formData.email) {
        newErrors.email = 'Email không được để trống';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }

      if (!formData.password) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    } else {
      if (!formData.characterName) {
        newErrors.characterName = 'Tên nhân vật không được để trống';
      } else if (formData.characterName.length < 2) {
        newErrors.characterName = 'Tên nhân vật phải có ít nhất 2 ký tự';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle class selection
  const handleClassSelect = (classId: string) => {
    setFormData(prev => ({ ...prev, class: classId }));
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateForm()) {
      setRegisterStep(2);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setRegisterStep(1);
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!agreeTerms) {
      alert('Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    setIsLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful registration
      const mockUserData = {
        id: 'user-' + Date.now(),
        username: formData.username,
        email: formData.email,
        characterName: formData.characterName,
        class: formData.class,
        level: 1,
        experience: 0,
        rank: 'Bronze',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
        createdAt: new Date().toISOString(),
      };

      if (onRegisterSuccess) {
        onRegisterSuccess(mockUserData);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: '', color: '#8a8fb0' };

    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;

    if (strength <= 2) return { strength: 20, text: 'Yếu', color: '#ff4444' };
    if (strength <= 4) return { strength: 50, text: 'Trung bình', color: '#ffd700' };
    return { strength: 100, text: 'Mạnh', color: '#44ff44' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="register-container">
      {/* Background effect */}
      <div className="register-bg">
        <div className="magic-circle"></div>
        <div className="floating-runes">
          <span>⚔️</span>
          <span>🛡️</span>
          <span>🏰</span>
          <span>🗡️</span>
          <span>🔮</span>
          <span>🏹</span>
        </div>
      </div>

      {/* Register card */}
      <div className="register-card">
        {/* Close button */}
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <span className="close-icon">✕</span>
          </button>
        )}

        {/* Header */}
        <div className="register-header">
          <div className="register-logo">
            <span className="logo-icon">⚔️</span>
            <h1 className="logo-text">TẠO NHÂN VẬT</h1>
            <span className="logo-icon">🛡️</span>
          </div>
          <p className="register-subtitle">
            Bước {registerStep}/2: {registerStep === 1 ? 'Thông tin tài khoản' : 'Tạo nhân vật'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: registerStep === 1 ? '50%' : '100%' }}
          ></div>
          <div className="progress-steps">
            <span className={`step ${registerStep >= 1 ? 'active' : ''}`}>1</span>
            <span className={`step-line ${registerStep >= 2 ? 'active' : ''}`}></span>
            <span className={`step ${registerStep >= 2 ? 'active' : ''}`}>2</span>
          </div>
        </div>

        {/* Form */}
        <form className="register-form" onSubmit={registerStep === 2 ? handleRegister : (e) => e.preventDefault()}>
          {registerStep === 1 ? (
            // Step 1: Account Information
            <div className="step-content">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  <span className="label-icon">👤</span>
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className={`form-input ${errors.username ? 'error' : ''}`}
                  placeholder="Nhập tên đăng nhập"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
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
                    name="password"
                    className={`form-input password-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ 
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color 
                        }}
                      ></div>
                    </div>
                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <span className="label-icon">🔐</span>
                  Xác nhận mật khẩu
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-input password-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <button 
                type="button" 
                className="next-btn"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                <span className="btn-text">TIẾP THEO</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
          ) : (
            // Step 2: Character Creation
            <div className="step-content">
              <div className="form-group">
                <label htmlFor="characterName" className="form-label">
                  <span className="label-icon">🏷️</span>
                  Tên nhân vật
                </label>
                <input
                  type="text"
                  id="characterName"
                  name="characterName"
                  className={`form-input ${errors.characterName ? 'error' : ''}`}
                  placeholder="Nhập tên nhân vật của bạn"
                  value={formData.characterName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.characterName && <span className="error-message">{errors.characterName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">⚔️</span>
                  Chọn lớp nhân vật
                </label>
                <div className="class-selector">
                  {characterClasses.map(charClass => (
                    <div
                      key={charClass.id}
                      className={`class-card ${formData.class === charClass.id ? 'selected' : ''}`}
                      onClick={() => handleClassSelect(charClass.id)}
                      style={{ borderColor: formData.class === charClass.id ? charClass.color : 'rgba(255,215,0,0.2)' }}
                    >
                      <div className="class-icon" style={{ color: charClass.color }}>
                        {charClass.icon}
                      </div>
                      <div className="class-info">
                        <h4 className="class-name">{charClass.name}</h4>
                        <p className="class-description">{charClass.description}</p>
                      </div>
                      {formData.class === charClass.id && (
                        <div className="selected-check">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="character-preview">
                <h4 className="preview-title">Xem trước nhân vật</h4>
                <div className="preview-card">
                  <div className="preview-avatar">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.characterName || 'hero'}&backgroundColor=ffd700`}
                      alt="Character preview"
                    />
                  </div>
                  <div className="preview-details">
                    <p><strong>Tên:</strong> {formData.characterName || '???'}</p>
                    <p><strong>Lớp:</strong> {characterClasses.find(c => c.id === formData.class)?.name}</p>
                    <p><strong>Cấp độ:</strong> 1</p>
                    <p><strong>Rank:</strong> Bronze</p>
                  </div>
                </div>
              </div>

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

              <div className="newsletter-checkbox">
                <label className="terms-label">
                  <input
                    type="checkbox"
                    checked={receiveNewsletter}
                    onChange={(e) => setReceiveNewsletter(e.target.checked)}
                  />
                  <span className="terms-text">
                    Nhận thông báo về sự kiện và ưu đãi qua email
                  </span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="prev-btn"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                >
                  <span className="btn-icon">←</span>
                  <span className="btn-text">QUAY LẠI</span>
                </button>

                <button 
                  type="submit" 
                  className="register-submit-btn"
                  disabled={isLoading || !agreeTerms}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>ĐANG TẠO...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">⚔️</span>
                      <span className="btn-text">BẮT ĐẦU HÀNH TRÌNH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Switch to login */}
        {registerStep === 1 && (
          <div className="switch-auth">
            <p>
              Đã có tài khoản?
              <button 
                className="switch-btn"
                onClick={() => navigete("/login")}
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className="register-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">🎮</span>
            <span className="benefit-text">Chơi miễn phí</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🏆</span>
            <span className="benefit-text">Xếp hạng hàng tuần</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎁</span>
            <span className="benefit-text">Quà tặng tân thủ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;