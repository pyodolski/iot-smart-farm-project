import React, { useEffect, useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../../image/leaves-growing-from-ground-green-glyph-style_78370-6720.png';
import { AuthContext } from '../../contexts/AuthContext';
import API_BASE_URL from '../../utils/config';
import { FaBars } from 'react-icons/fa';
import { VscBell, VscBellDot } from "react-icons/vsc";
import { LuListX, LuListPlus } from "react-icons/lu";
import Login from '../../pages/auth/Login';

function Navbar() {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKakaoModal, setShowKakaoModal] = useState(false);
  const [pendingFarms, setPendingFarms] = useState([]);
  const [showPendingFarms, setShowPendingFarms] = useState(false);
  
  // 회원가입 관련 상태
  const [activeTab, setActiveTab] = useState('login'); // 'login' 또는 'register'
  const [registerData, setRegisterData] = useState({
    name: '',
    nickname: '',
    id: '',
    password: '',
    password_confirm: '',
    email: '',
    emailDomain: '',
    verificationCode: ''
  });
  const [passwordMatch, setPasswordMatch] = useState(null); // null, true, false
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // 애니메이션 관련 상태
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(''); // 'left', 'right'

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY < 10) {
            setShow(true);
          } else if (window.scrollY > lastScrollY) {
            setShow(false);
          } else {
            setShow(true);
          }
          setLastScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 알림 목록 가져오기
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('알림 가져오기 실패:', error);
    }
  };

  // 로그인 상태가 변경되거나 컴포넌트가 마운트될 때 알림 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      // 60초마다 알림 갱신
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // 알림 클릭 처리
  const handleNotificationClick = async (notification) => {
    try {
      // 알림 삭제
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notification.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // 알림 목록 업데이트
        setNotifications(notifications.filter(n => n.id !== notification.id));
        
        // 해당 페이지로 이동
        navigate(notification.url);
        setShowNotifications(false);
      }
    } catch (error) {
      console.error('알림 처리 실패:', error);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userId');
        setIsLoggedIn(false);
        setId('');
        setPassword('');
        navigate('/login');
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 알림 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        console.log('로그인 성공:', data);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', data.user_id);
        sessionStorage.setItem('nickname', data.nickname);
        setIsLoggedIn(true);
        setShowLoginForm(false);

        if (data.admin) {
          window.location.href = `${API_BASE_URL}/admin.html`;
        } else {
          navigate('/');
        }
      } else {
        console.error('로그인 실패:', data);
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    setShowKakaoModal(true);
  };

  const handleKakaoModalYes = () => {
    setShowKakaoModal(false);
    window.location.href = `${API_BASE_URL}/auth/kakao`;
  };

  const resetLoginForm = () => {
    setId('');
    setPassword('');
    setError('');
    setShowLoginForm(false);
    setActiveTab('login');
    setRegisterData({
      name: '',
      nickname: '',
      id: '',
      password: '',
      password_confirm: '',
      email: '',
      emailDomain: '',
      verificationCode: ''
    });
    setPasswordMatch(null);
    setIsEmailVerified(false);
    setShowEmailModal(false);
    setIsAnimating(false);
    setAnimationDirection('');
  };

  // 탭 전환 애니메이션 함수
  const handleTabChange = (newTab) => {
    if (newTab === activeTab || isAnimating) return;
    
    setIsAnimating(true);
    
    if (newTab === 'register') {
      setAnimationDirection('right');
    } else {
      setAnimationDirection('left');
    }
    
    setTimeout(() => {
      setActiveTab(newTab);
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationDirection('');
      }, 50);
    }, 200);
  };

  const handleKakaoModalNo = () => {
    setShowKakaoModal(false);
    resetLoginForm();
    alert('마이페이지에서 연동한 후 이용해 주세요');
    navigate('/');
  };

  // 회원가입 관련 함수들
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    
    // 비밀번호 확인 처리
    if (name === 'password_confirm') {
      if (value === registerData.password && value !== '') {
        setPasswordMatch(true);
      } else if (value !== '') {
        setPasswordMatch(false);
      } else {
        setPasswordMatch(null);
      }
    }
  };

  const handleEmailVerification = async () => {
    if (!registerData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    
    const domain = registerData.emailDomain || 'gmail.com';
    const fullEmail = `${registerData.email}@${domain}`;
    
    console.log('이메일 인증 요청:', fullEmail);
    
    try {
      const response = await fetch(`${API_BASE_URL}/send_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: fullEmail })
      });
      
      console.log('이메일 인증 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('이메일 인증 응답 데이터:', data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || '인증 코드 전송 실패');
      }
      
      setShowEmailModal(true);
      setError('');
    } catch (error) {
      console.error('이메일 인증 에러:', error);
      setError(error.message || '이메일 인증 중 오류가 발생했습니다.');
    }
  };

  const handleVerifyCode = async () => {
    if (!registerData.verificationCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }
    
    console.log('인증 코드 확인:', registerData.verificationCode);
    
    try {
      const response = await fetch(`${API_BASE_URL}/check_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: registerData.verificationCode })
      });
      
      console.log('인증 코드 확인 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('인증 코드 확인 응답 데이터:', data);
      
      if (!response.ok || !data.verified) {
        throw new Error(data.message || data.error || '인증 코드가 일치하지 않습니다.');
      }
      
      setIsEmailVerified(true);
      setShowEmailModal(false);
      setError('');
    } catch (error) {
      console.error('인증 코드 확인 에러:', error);
      setError(error.message || '인증 코드 확인 중 오류가 발생했습니다.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    console.log('회원가입 시도:', registerData);
    
    // 유효성 검사
    if (!registerData.name || !registerData.nickname || !registerData.id || 
        !registerData.password || !registerData.email) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    if (registerData.password !== registerData.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (!isEmailVerified) {
      setError('이메일 인증이 필요합니다.');
      return;
    }
    
    setIsLoading(true);
    setError(''); // 에러 메시지 초기화
    
    try {
      const domain = registerData.emailDomain || 'gmail.com';
      const fullEmail = `${registerData.email}@${domain}`;
      
      const requestData = {
        id: (registerData.id || '').trim(),
        password: registerData.password || '',
        password_confirm: registerData.password_confirm || '',
        nickname: (registerData.nickname || '').trim(),
        email: (fullEmail || '').trim(),
        name: (registerData.name || '').trim()
      };
      
      console.log('전송할 데이터:', requestData);
      console.log('API URL:', `${API_BASE_URL}/register`);
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      console.log('응답 상태:', response.status);
      console.log('응답 헤더:', response.headers);
      
      const data = await response.json();
      console.log('응답 데이터:', data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || '회원가입 실패');
      }
      
      alert('회원가입이 완료되었습니다!');
      resetLoginForm();
    } catch (error) {
      console.error('회원가입 에러:', error);
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 외부에서 로그인 모달 열기 이벤트 처리 (예: 시작하기 버튼)
  useEffect(() => {
    const openLogin = () => setShowLoginForm(true);
    window.addEventListener('open-login-modal', openLogin);
    return () => window.removeEventListener('open-login-modal', openLogin);
  }, []);

  // 승인 대기 목록 가져오기
  const fetchPendingFarms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/farms/pending`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingFarms(data.pending_farms || []);
      }
    } catch (error) {
      console.error('승인 대기 목록 가져오기 실패:', error);
    }
  };

  // 로그인 상태가 변경되거나 컴포넌트가 마운트될 때 승인 대기 목록 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchPendingFarms();
      // 60초마다 갱신
      const interval = setInterval(fetchPendingFarms, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // 승인 대기 목록 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPendingFarms && !event.target.closest('.pending-farms-container')) {
        setShowPendingFarms(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPendingFarms]);

  const isLoginPage = location.pathname === '/login';
  
  return (
    <>
      <nav 
        className={`navbar ${show ? 'navbar-show' : 'navbar-hide'} ${isLoginPage ? 'navbar-transparent' : ''}`}
        style={isLoginPage ? {
          background: 'transparent',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          boxShadow: 'none',
          border: 'none',
          borderBottom: 'none'
        } : {}}
      >
        <div className="nav-brand" onClick={handleLogoClick}>
          <img 
            src={logo}
            alt="Smart Farm Hub" 
            className="nav-logo" 
          />
          <span className="brand-text" style={{fontSize: "1.6rem"}}>Smart Farm Hub</span>
        </div>
        <div className="nav-menu">
          {/* 데스크탑 메뉴 */}
          <div className="menu-items desktop-menu">
            {isLoggedIn ? (
              <>
                <a onClick={()=> navigate('/Products')}>Products</a>
                <a onClick={()=> navigate('/encyclopedia')}>Encyclopedia</a>
                <a onClick={()=> navigate('/')}>Farm</a>
                <a onClick={()=> navigate('/Statistics')}>Statistics</a>
                <a onClick={()=> navigate('/community')}>Community</a>
                <div className="notification-container">
                  <button 
                    className="notification-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotifications(!showNotifications);
                    }}
                  >
                    {notifications.length > 0 ? <VscBellDot size={24} /> : <VscBell size={24} />}
                    {notifications.length > 0 && (
                      <span className="notification-badge">{notifications.length}</span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="notification-popup">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="notification-item"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p>{notification.message}</p>
                            <span className="notification-date">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="no-notifications">
                          새로운 알림이 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="pending-farms-container">
                  <button 
                    className="pending-farms-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPendingFarms(!showPendingFarms);
                    }}
                    title="승인 대기 목록"
                  >
                    {pendingFarms.length > 0 ? <LuListPlus size={24} /> : <LuListX size={24} />}
                  </button>
                  {showPendingFarms && (
                    <div className="pending-farms-popup">
                      {pendingFarms.length > 0 ? (
                        pendingFarms.map((farm) => (
                          <div
                            key={farm.id}
                            className="pending-farm-item"
                          >
                            <p>농장명: {farm.name}</p>
                            <p>위치: {farm.location}</p>
                          </div>
                        ))
                      ) : (
                        <div className="no-pending-farms">
                          승인 대기 중인 농장이 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button className="login-btn" onClick={()=> navigate('/profile')}>
                  {sessionStorage.getItem('nickname')}님 환영합니다
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <button className="nav-login-btn" onClick={() => {setShowLoginForm(true); setMenuOpen(false);}}>
                시작하기
              </button>
            )}
          </div>
          {/* 모바일 햄버거 메뉴 */}
          <button className="hamburger-menu" onClick={()=>setMenuOpen(!menuOpen)}>
            <FaBars size={28} />
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              {isLoggedIn ? (
                <>
                  <a onClick={()=> {navigate('/Products'); setMenuOpen(false);}}>Products</a>
                  <a onClick={()=> {navigate('/encyclopedia'); setMenuOpen(false);}}>Encyclopedia</a>
                  <a onClick={()=> {navigate('/'); setMenuOpen(false);}}>Farm</a>
                  <a onClick={()=> {navigate('/Statistics'); setMenuOpen(false);}}>Statistics</a>
                  <a onClick={()=> {navigate('/community'); setMenuOpen(false);}}>Community</a>
                  <div className="notification-container">
                    <button 
                      className="notification-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotifications(!showNotifications);
                      }}
                    >
                      {notifications.length > 0 ? <VscBellDot size={24} /> : <VscBell size={24} />}
                      {notifications.length > 0 && (
                        <span className="notification-badge">{notifications.length}</span>
                      )}
                    </button>
                  </div>
                  <div className="pending-farms-container">
                    <button 
                      className="pending-farms-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPendingFarms(!showPendingFarms);
                      }}
                      title="승인 대기 목록"
                    >
                      {pendingFarms.length > 0 ? <LuListPlus size={24} /> : <LuListX size={24} />}
                    </button>
                  </div>
                  {showPendingFarms && (
                    <div className="pending-farms-popup">
                      {pendingFarms.length > 0 ? (
                        pendingFarms.map((farm) => (
                          <div
                            key={farm.id}
                            className="pending-farm-item"
                          >
                            <p>농장명: {farm.name}</p>
                            <p>위치: {farm.location}</p>
                          </div>
                        ))
                      ) : (
                        <div className="no-pending-farms">
                          승인 대기 중인 농장이 없습니다
                        </div>
                      )}
                    </div>
                  )}
                  <button className="login-btn" onClick={()=> {navigate('/profile'); setMenuOpen(false);}}>
                    {sessionStorage.getItem('nickname')}님 환영합니다
                  </button>
                  <button className="logout-btn" onClick={()=> {handleLogout(); setMenuOpen(false);}}>
                    로그아웃
                  </button>
                </>
              ) : (
                <button className="login-btn" onClick={() => {setShowLoginForm(true); setMenuOpen(false);}}>
                  로그인
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
      {showLoginForm && (
        <div className="login-modal-overlay" onClick={resetLoginForm}>
          <div className="login-modal-content" onClick={e => e.stopPropagation()}>
            <div className="login-form-box">
              <div className="modal-tabs">
                <button 
                  className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => handleTabChange('login')}
                >
                  로그인
                </button>
                <button 
                  className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => handleTabChange('register')}
                >
                  회원가입
                </button>
                <button className="close-button" onClick={resetLoginForm}>×</button>
              </div>
              
              <h2 className="modal-title">{activeTab === 'login' ? '로그인' : '회원가입'}</h2>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="modal-content-wrapper">
                <div className={`modal-form-container ${isAnimating ? 'animating' : ''}`}>
                  <div className={`modern-form ${activeTab === 'login' ? 'login-form' : 'register-form'} ${
                    isAnimating ? (animationDirection === 'right' ? 'slide-out-left' : 'slide-out-right') : ''
                  } ${activeTab === 'register' && !isAnimating ? 'slide-in' : ''}`}>
                {activeTab === 'login' ? (
                  <form onSubmit={handleLogin}>
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="ID"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      className="login-button"
                      disabled={isLoading}
                    >
                      {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    {/* 이름 한줄 */}
                    <div className="input-group">
                      <input
                        type="text"
                        name="name"
                        placeholder="이름"
                        value={registerData.name}
                        onChange={handleRegisterChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* 닉네임 한줄 */}
                    <div className="input-group">
                      <input
                        type="text"
                        name="nickname"
                        placeholder="닉네임"
                        value={registerData.nickname}
                        onChange={handleRegisterChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* 아이디 한줄 */}
                    <div className="input-group">
                      <input
                        type="text"
                        name="id"
                        placeholder="아이디"
                        value={registerData.id}
                        onChange={handleRegisterChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* 비밀번호 한줄 */}
                    <div className="input-group">
                      <input
                        type="password"
                        name="password"
                        placeholder="비밀번호"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* 비밀번호 확인 + 확인 버튼 한줄 */}
                    <div className="input-group">
                      <input
                        type="password"
                        name="password_confirm"
                        placeholder="비밀번호 확인"
                        value={registerData.password_confirm}
                        onChange={handleRegisterChange}
                        required
                        disabled={isLoading}
                        style={{ display: passwordMatch === true ? 'none' : 'block' }}
                      />
                    </div>
                    {passwordMatch === true && (
                      <div className="password-match-success">✓ 비밀번호가 일치합니다</div>
                    )}
                    {passwordMatch === false && (
                      <div className="password-match-error">✗ 비밀번호가 일치하지 않습니다</div>
                    )}
                    
                    {/* 이메일 + 인증 코드 버튼 한줄 */}
                    <div className="email-row">
                      <div className="email-input-container">
                        <input
                          type="text"
                          name="email"
                          placeholder="이메일"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          required
                          disabled={isLoading}
                          className="email-input"
                        />
                        <span className="email-at">@</span>
                        <div className="email-domain-wrapper">
                          <input
                            type="text"
                            name="emailDomain"
                            placeholder="도메인"
                            value={registerData.emailDomain}
                            onChange={handleRegisterChange}
                            disabled={isLoading}
                            className="email-domain"
                            list="email-domains"
                            autoComplete="off"
                          />
                          <datalist id="email-domains">
                            <option value="gmail.com">gmail.com</option>
                            <option value="naver.com">naver.com</option>
                            <option value="daum.net">daum.net</option>
                            <option value="yahoo.com">yahoo.com</option>
                            <option value="hotmail.com">hotmail.com</option>
                            <option value="outlook.com">outlook.com</option>
                          </datalist>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="verify-button"
                        onClick={handleEmailVerification}
                        disabled={isLoading || !registerData.email}
                      >
                        인증
                      </button>
                    </div>
                    
                    <button
                      type="submit"
                      className="login-button"
                      disabled={isLoading || !isEmailVerified}
                    >
                      {isLoading ? '회원가입 중...' : '회원가입'}
                    </button>
                  </form>
                )}
                
                {activeTab === 'login' && (
                  <>
                    <div className="divider">
                      <span>OR</span>
                    </div>
                    
                    <div className="social-buttons">
                      <button
                        className="kakao-login-button"
                        onClick={handleKakaoLogin}
                        disabled={isLoading}
                        type="button"
                      >
                        카카오로 로그인
                      </button>
                    </div>
                  </>
                )}
                
                <p className="terms-text">
                  {activeTab === 'login' ? '로그인' : '계정 생성'} 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의합니다.
                </p>
              </div>
              {showKakaoModal && ReactDOM.createPortal(
                (
                  <div className="register-modal-overlay" onClick={handleKakaoModalNo}>
                    <div className="modal-box" onClick={(e)=> e.stopPropagation()}>
                      <p>카카오톡 로그인을 클릭하셨습니다.<br/>카카오톡 연동을 하셨나요?</p>
                      <auth-button onClick={handleKakaoModalYes}>네</auth-button>
                      <auth-button onClick={handleKakaoModalNo}>아니요</auth-button>
                    </div>
                  </div>
                ),
                document.body
              )}
              
              {showEmailModal && ReactDOM.createPortal(
                (
                  <div className="register-modal-overlay" onClick={() => setShowEmailModal(false)}>
                    <div className="modal-box" onClick={(e)=> e.stopPropagation()}>
                      <h3>이메일 인증</h3>
                      <p>이메일로 전송된 인증 코드를 입력해주세요.</p>
                      <div className="input-group">
                        <input
                          type="text"
                          name="verificationCode"
                          placeholder="인증 코드"
                          value={registerData.verificationCode}
                          onChange={handleRegisterChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="modal-buttons">
                        <button
                          className="verify-button"
                          onClick={handleVerifyCode}
                          disabled={isLoading || !registerData.verificationCode}
                        >
                          {isLoading ? '인증 중...' : '인증 확인'}
                        </button>
                        <button
                          className="cancel-button"
                          onClick={() => setShowEmailModal(false)}
                          disabled={isLoading}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                ),
                document.body
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar; 