import React from 'react';
import { HistoryItem } from '../App';
import { History, CheckCircle, XCircle } from 'lucide-react';

interface HistoryTableProps {
  history: HistoryItem[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  return (
    <div className="glass-panel animate-fade-in stagger-2" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
          <History size={18} className="text-gradient" /> Applications History
        </div>
      </div>
      
      <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Company</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Mode</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No applications processed yet.
                </td>
              </tr>
            ) : (
              history.map((j) => (
                <tr key={j.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 600 }}>{j.company}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{j.title}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge" style={{ textTransform: 'capitalize' }}>
                      {j.apply_mode || 'autonomous'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${j.status === 'applied' ? 'badge-success' : 'badge-primary'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}>
                      {j.status === 'applied' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(j.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
