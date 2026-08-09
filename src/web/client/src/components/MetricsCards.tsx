import React from 'react';
import { CandidateFacts } from '../App';
import { Target, Brain, Cpu, UserCircle } from 'lucide-react';

interface MetricsCardsProps {
  stats: {
    dailyApplied: number;
    maxDaily: number;
    qaTotalAnswers: number;
    qaTotalReuses: number;
    activeProvider: string;
    mode: string;
  };
  candidate: CandidateFacts | null;
  onOpenMemory: () => void;
  onOpenProfile: () => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  stats,
  candidate,
  onOpenMemory,
  onOpenProfile,
}) => {
  const percent = Math.min(100, Math.round((stats.dailyApplied / stats.maxDaily) * 100));

  return (
    <div className="animate-slide-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
      
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex-between">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Applications
          </div>
          <Target size={16} color="var(--accent-primary)" />
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {stats.dailyApplied} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats.maxDaily}</span>
        </div>
        
        {/* Progress bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.25rem' }}>
          <div style={{ height: '100%', width: `${percent}%`, background: 'var(--gradient-primary)', transition: 'width 1s ease-in-out' }} />
        </div>
        
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 600 }}>
          {percent}% of daily target reached
        </div>
      </div>

      <div className="glass-card" onClick={onOpenMemory} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}>
        <div className="flex-between">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Q&A Memory Cache
          </div>
          <Brain size={16} color="var(--accent-secondary)" />
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {stats.qaTotalAnswers} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Answers</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 600, marginTop: 'auto' }}>
          🧠 {stats.qaTotalReuses} Cache Reuses
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex-between">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active AI Engine
          </div>
          <Cpu size={16} color="var(--accent-success)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', lineHeight: 1.1 }}>
          {stats.activeProvider}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 'auto' }}>
          Provider Adapter Ready
        </div>
      </div>

      <div className="glass-card" onClick={onOpenProfile} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}>
        <div className="flex-between">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Candidate Profile
          </div>
          <UserCircle size={16} color="var(--accent-primary)" />
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {candidate ? candidate.fullName : 'Not Configured'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 'auto' }}>
          {candidate ? candidate.email : 'Click to setup'}
        </div>
      </div>
      
    </div>
  );
};
