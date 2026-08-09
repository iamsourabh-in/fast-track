import React from 'react';
import { UserProfile } from '../App';
import { LogOut, RefreshCw, User, Settings, Database, BrainCircuit, FileText } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  activeProvider: string;
  activeMode: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  onResetDb: () => void;
  onOpenProfile: () => void;
  onOpenMemory: () => void;
  onOpenResume: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeProvider,
  activeMode,
  onOpenAuth,
  onLogout,
  onResetDb,
  onOpenProfile,
  onOpenMemory,
  onOpenResume,
  onRefresh,
}) => {
  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    onRefresh();
  };

  const handleModeChange = async (mode: string) => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    onRefresh();
  };

  return (
    <header style={{
      background: 'rgba(9, 9, 11, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-light)',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
    }}>
      <div className="flex-center" style={{ gap: '0.75rem' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--gradient-primary)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Settings size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            <span className="text-gradient">FastApply</span> Pro
          </h1>
          <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', marginTop: '2px' }}>
            Enterprise Edition
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {user ? (
          <>
            <button className="btn btn-secondary" onClick={onOpenProfile}>
              <User size={16} /> Edit Profile
            </button>
            <button className="btn btn-secondary" onClick={onOpenMemory}>
              <BrainCircuit size={16} /> Memory Bank
            </button>
            <button className="btn btn-secondary" onClick={onOpenResume}>
              <FileText size={16} /> Sources
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 4px' }} />

            <button className="btn btn-danger" onClick={onResetDb} title="Purge database and start fresh">
              <Database size={16} /> Reset DB
            </button>
            <button className="btn btn-ghost" onClick={onLogout} style={{ color: 'var(--text-muted)' }}>
              <LogOut size={16} /> {user.fullName.split(' ')[0]}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onOpenAuth}>
            Log In / Register
          </button>
        )}

        <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 4px' }} />

        <select
          value={activeProvider}
          onChange={handleProviderChange}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-primary)',
            padding: '0.5rem 2rem 0.5rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            appearance: 'none',
            outline: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.7rem center',
          }}
        >
          <option value="ollama" style={{ background: '#0f172a' }}>🦙 Ollama (Local)</option>
          <option value="gemini" style={{ background: '#0f172a' }}>💎 Gemini Flash</option>
          <option value="openai" style={{ background: '#0f172a' }}>🤖 OpenAI GPT-4o</option>
        </select>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '9999px', border: '1px solid var(--border-light)' }}>
          {['copilot', 'autonomous', 'stealth', 'swipe'].map((m) => {
            const isActive = activeMode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                style={{
                  background: isActive ? 'var(--gradient-primary)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                {m === 'copilot' && '🤝 '}
                {m === 'autonomous' && '⚡ '}
                {m === 'stealth' && '🕵️ '}
                {m === 'swipe' && '📱 '}
                {m}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
