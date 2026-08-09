import React, { useState } from 'react';
import { UserProfile } from '../App';
import { Key, UserPlus, LogIn, Mail, Lock, User, X } from 'lucide-react';

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
        setStatusMsg({ text: `Welcome back, ${data.user.fullName}!`, isError: false });
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1000);
      } else {
        setStatusMsg({ text: `Login failed: ${data.error}`, isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Auth error: ${err.message}`, isError: true });
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
        setStatusMsg({ text: `Account created for ${data.user.fullName}!`, isError: false });
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1000);
      } else {
        setStatusMsg({ text: `Registration failed: ${data.error}`, isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Auth error: ${err.message}`, isError: true });
    }
  };

  return (
    <div className="animate-fade-in flex-center" style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-slide-up" style={{
        width: '90%',
        maxWidth: '420px',
        padding: '2.5rem',
        position: 'relative'
      }}>
        {!hideCloseButton && onClose && (
          <button 
            onClick={onClose} 
            className="btn-ghost flex-center" 
            style={{ position: 'absolute', top: '1rem', right: '1rem', width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
          >
            <X size={18} />
          </button>
        )}

        <div className="flex-center" style={{ flexDirection: 'column', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'var(--gradient-primary)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Key size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: '#fff' }}>
            FastApply Auth
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Sign in to your enterprise agent dashboard.
          </p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '0.25rem', marginBottom: '2rem' }}>
          <button
            onClick={() => { setTab('login'); setStatusMsg(null); }}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
              background: tab === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: tab === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: tab === 'login' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab('register'); setStatusMsg(null); }}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
              background: tab === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: tab === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: tab === 'register' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleLogin}>
              <LogIn size={18} /> Access Dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="btn btn-success" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleRegister}>
              <UserPlus size={18} /> Create Account
            </button>
          </div>
        )}

        {statusMsg && (
          <div className="animate-fade-in" style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            textAlign: 'center',
            background: statusMsg.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: statusMsg.isError ? 'var(--accent-danger)' : 'var(--accent-success)',
            border: `1px solid ${statusMsg.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
          }}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};
