import React from 'react';
import { CandidateFacts } from '../App';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
      <div style={{
        background: 'rgba(22, 30, 46, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Daily Applications Cap
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {stats.dailyApplied} / {stats.maxDaily}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
          ⚡ {percent}% of daily target reached
        </div>
      </div>

      <div
        onClick={onOpenMemory}
        title="Click to view & edit Q&A Memory Bank"
        style={{
          background: 'rgba(22, 30, 46, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          cursor: 'pointer'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Q&A Memory Bank Cache
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {stats.qaTotalAnswers} Answers
        </div>
        <div style={{ fontSize: '0.8rem', color: '#34d399' }}>
          🧠 {stats.qaTotalReuses} Cache Reuses
        </div>
      </div>

      <div style={{
        background: 'rgba(22, 30, 46, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active AI Model
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase' }}>
          {stats.activeProvider}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
          Provider Adapter Ready
        </div>
      </div>

      <div
        onClick={onOpenProfile}
        title="Click to open Candidate Profile Editor"
        style={{
          background: 'rgba(22, 30, 46, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          cursor: 'pointer'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Candidate Profile & Contact
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {candidate ? candidate.fullName : 'Sourabh Rustagi'}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
          {candidate ? candidate.email : 'sourabh.rustagi@hotmail.com'}
        </div>
      </div>
    </div>
  );
};
