import React, { useState } from 'react';
import { UserProfile } from '../App';

interface AuthModalProps {
  onClose?: () => void;
  onAuthSuccess: (token: string, user: UserProfile) => void;
  hideCloseButton?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, hideCloseButton }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('sourabh.rustagi@hotmail.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatusMsg({ text: 'Please enter both email and password.', isError: true });
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: `✅ Welcome back, ${data.user.fullName}!`, isError: false });
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1000);
      } else {
        setStatusMsg({ text: `❌ Login failed: ${data.error}`, isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ Auth error: ${err.message}`, isError: true });
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setStatusMsg({ text: 'Please complete all registration fields.', isError: true });
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: `✅ Account created for ${data.user.fullName}!`, isError: false });
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1000);
      } else {
        setStatusMsg({ text: `❌ Registration failed: ${data.error}`, isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ Auth error: ${err.message}`, isError: true });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#0f1420',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        width: '90%',
        maxWidth: '450px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem', textAlign: 'center' }}>
          🔑 SaaS Account Authentication
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => { setTab('login'); setStatusMsg(null); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: tab === 'login' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🔑 Log In
          </button>
          <button
            onClick={() => { setTab('register'); setStatusMsg(null); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: tab === 'register' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📝 Register
          </button>
        </div>

        {tab === 'login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Email Address:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  marginTop: '0.25rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  marginTop: '0.25rem'
                }}
              />
            </div>
            <button
              onClick={handleLogin}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                color: 'white',
                padding: '0.6rem 1rem',
                borderRadius: '9999px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              🚀 Log In to FastApply
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Full Name:</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sourabh Rustagi"
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  marginTop: '0.25rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Email Address:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  marginTop: '0.25rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  marginTop: '0.25rem'
                }}
              />
            </div>
            <button
              onClick={handleRegister}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: 'white',
                padding: '0.6rem 1rem',
                borderRadius: '9999px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              ✨ Create SaaS Account
            </button>
          </div>
        )}

        {statusMsg && (
          <div style={{
            fontSize: '0.8rem',
            textAlign: 'center',
            color: statusMsg.isError ? '#f87171' : '#34d399'
          }}>
            {statusMsg.text}
          </div>
        )}

        {!hideCloseButton && onClose && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
