import React, { useState, useEffect, useRef } from 'react';
import './Register.css';
import API_BASE_URL from '../../utils/config';

const Register = () => {
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    password_confirm: '',
    nickname: '',
    emailLocal: '',
    emailDomain: '',
    email: '',
    name: '',
    verificationCode: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const updateEmail = (local, domain) => `${local || ''}@${domain || ''}`.replace(/^@/, '');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'emailLocal') {
      setFormData(prev => ({
        ...prev,
        emailLocal: value,
        email: updateEmail(value, prev.emailDomain)
      }));
    } else if (name === 'emailDomain') {
      setFormData(prev => ({
        ...prev,
        emailDomain: value,
        email: updateEmail(prev.emailLocal, value)
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
    setError('');
  };

  // 도메인 드롭다운 상태 및 제어
  const domainOptions = ['gmail.com', 'naver.com', 'daum.net', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const [showDomainMenu, setShowDomainMenu] = useState(false);
  const domainRef = useRef(null);

  const toggleDomainMenu = () => setShowDomainMenu((prev) => !prev);
  const handleSelectDomain = (val) => {
    handleChange({ target: { name: 'emailDomain', value: val } });
    setShowDomainMenu(false);
  };

  useEffect(() => {
    const onOutside = (e) => {
      if (domainRef.current && !domainRef.current.contains(e.target)) {
        setShowDomainMenu(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleEmailVerification = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/send_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '인증 코드 전송 실패');
      setSuccess('인증 코드가 이메일로 전송되었습니다.');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleVerifyCode = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/check_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: formData.verificationCode })
      });
      const data = await response.json();
      if (!response.ok || !data.verified) throw new Error(data.message || '인증 코드가 일치하지 않습니다.');
      setIsEmailVerified(true);
      setSuccess('이메일 인증이 완료되었습니다.');
    } catch (error) {
      setError(error.message);
    }
  };

  const validateForm = () => {
    // 모든 필드가 채워져 있는지 확인
    if (!formData.id || !formData.password || !formData.password_confirm || 
        !formData.nickname || !formData.emailLocal || !formData.emailDomain || !formData.email || !formData.name) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }

    // 비밀번호 일치 확인
    if (formData.password !== formData.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    // 아이디 길이 확인
    if (formData.id.length < 3) {
      setError('아이디는 3글자 이상이어야 합니다.');
      return false;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 4) {
      setError('비밀번호는 4글자 이상이어야 합니다.');
      return false;
    }

    // 이메일 인증 확인
    if (!isEmailVerified) {
      setError('이메일 인증이 필요합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // 명시적으로 payload 구성 (누락 방지 및 공백 제거)
      const payload = {
        id: (formData.id || '').trim(),
        password: formData.password || '',
        password_confirm: formData.password_confirm || '',
        nickname: (formData.nickname || '').trim(),
        email: (formData.email || '').trim(),
        name: (formData.name || '').trim()
      };

      // 디버깅 로그 (필요 시 확인)
      // eslint-disable-next-line no-console
      console.debug('register payload', payload);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '회원가입 실패');
      }
      
      setSuccess('회원가입에 성공했습니다!');
      // 로그인 페이지로 리다이렉트
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container">
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="id">아이디 (3글자 이상):</label>
          <input
            type="text"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="password">비밀번호 (4글자 이상):</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="password_confirm">비밀번호 확인:</label>
          <input
            type="password"
            id="password_confirm"
            name="password_confirm"
            value={formData.password_confirm}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="nickname">닉네임:</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row email-row">
          <label htmlFor="emailLocal">이메일:</label>
          <div className="email-input-container">
            <input
              type="text"
              id="emailLocal"
              name="emailLocal"
              placeholder="이메일"
              value={formData.emailLocal}
              onChange={handleChange}
              required
              className="email-input"
            />
            <span className="email-at">@</span>
            <div className="email-domain-wrapper" ref={domainRef}>
              <input
                type="text"
                id="emailDomain"
                name="emailDomain"
                placeholder="도메인"
                className="email-domain dropbtn"
                value={formData.emailDomain}
                onChange={handleChange}
                autoComplete="off"
              />
              <button type="button" className="domain-dropdown-btn dropbtn_click" onClick={toggleDomainMenu} aria-label="도메인 목록 열기">⌵</button>
              {showDomainMenu && (
                <div className="domain-dropdown-menu dropdown-content">
                  {domainOptions.map((d) => (
                    <div key={d} className="domain-dropdown-item" onClick={() => handleSelectDomain(d)}>{d}</div>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="verify-button" onClick={handleEmailVerification}>이메일 인증코드 전송</button>
          </div>
        </div>

        {!isEmailVerified && (
          <div className="form-row">
            <label htmlFor="verificationCode">인증코드:</label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleChange}
            />
            <button type="button" onClick={handleVerifyCode}>인증코드 확인</button>
          </div>
        )}

        <div className="form-row">
          <label htmlFor="name">이름:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit">회원가입</button>
      </form>
    </div>
  );
};

export default Register; 