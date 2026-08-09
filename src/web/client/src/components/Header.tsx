import React from 'react';
import { UserProfile } from '../App';

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
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(15, 20, 32, 0.85)',
      backdropFilter: 'blur(12px)',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', fontWeight: 800 }}>
        <span style={{ fontSize: '1.5rem' }}>⚡</span>
        <span style={{
          background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          FastApply Pro
        </span>
        <span style={{
          fontSize: '0.7rem',
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          border: '1px solid rgba(96, 165, 250, 0.3)',
          padding: '0.15rem 0.5rem',
          borderRadius: '9999px'
        }}>
          SaaS Enterprise
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {user ? (
          <>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid #ec4899',
                color: '#ec4899',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              👤 {user.fullName} (Logout)
            </button>

            <button
              onClick={onResetDb}
              title="Purge database tables and start completely fresh"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              💣 Reset DB & Start Fresh
            </button>
          </>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid #ec4899',
              color: '#ec4899',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔑 Log In / Register
          </button>
        )}

        <button
          onClick={onOpenProfile}
          style={{
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid #a78bfa',
            color: '#a78bfa',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          👤 Edit Profile
        </button>

        <button
          onClick={onOpenMemory}
          style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid #34d399',
            color: '#34d399',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🧠 Memory Bank
        </button>

        <button
          onClick={onOpenResume}
          style={{
            background: 'rgba(96, 165, 250, 0.1)',
            border: '1px solid #60a5fa',
            color: '#60a5fa',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📄 PDF & Website Source
        </button>

        <select
          value={activeProvider}
          onChange={handleProviderChange}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value="ollama">🦙 Ollama (Local)</option>
          <option value="gemini">💎 Gemini 2.5 Flash</option>
          <option value="openai">🤖 OpenAI GPT-4o</option>
        </select>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['copilot', 'autonomous', 'stealth', 'swipe'].map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                background: activeMode === m ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'white',
                padding: '0.5rem 0.8rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {m === 'copilot' && '🤝 '}
              {m === 'autonomous' && '⚡ '}
              {m === 'stealth' && '🕵️ '}
              {m === 'swipe' && '📱 '}
              {m}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
