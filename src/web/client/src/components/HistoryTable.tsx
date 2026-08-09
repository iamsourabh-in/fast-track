import React from 'react';
import { HistoryItem } from '../App';

interface HistoryTableProps {
  history: HistoryItem[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  return (
    <div style={{
      background: 'rgba(22, 30, 46, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span>📋</span> Recent Applications History
      </div>
      <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Company</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Mode</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>
                  No applications processed yet.
                </td>
              </tr>
            ) : (
              history.map((j) => (
                <tr key={j.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}><strong>{j.company}</strong></td>
                  <td style={{ padding: '0.75rem 1rem' }}>{j.title}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                      {j.apply_mode || 'autonomous'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: j.status === 'applied' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: j.status === 'applied' ? '#34d399' : '#f87171'
                    }}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                    {new Date(j.applied_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
