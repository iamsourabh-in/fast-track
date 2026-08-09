import React from 'react';
import { HistoryItem } from '../App';
import { HistoryTable } from './HistoryTable';
import { X } from 'lucide-react';

interface HistoryModalProps {
  history: HistoryItem[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose }) => {
  return (
    <div className="animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '900px', height: '80vh', padding: '2.5rem', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📜 Application History</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <HistoryTable history={history} />
        </div>
      </div>
    </div>
  );
};
