import React, { useState } from 'react';
import { AuditItem } from '../App';

interface ConsolePanelProps {
  logs: string[];
  auditLogs: AuditItem[];
  agentState: {
    activeStep: number;
    stepName: string;
    progressPercent: number;
    currentJobTitle: string;
    currentCompany: string;
    currentUrl: string;
  };
  activeProvider: string;
  fetchAuditLogs: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  auditLogs,
  agentState,
  activeProvider,
  fetchAuditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'flow' | 'audit'>('terminal');

  return (
    <div style={{
      background: 'rgba(22, 30, 46, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💻</span> Agent Execution Flow & Audit Logs
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setActiveTab('terminal')}
            style={{
              background: activeTab === 'terminal' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'terminal' ? 'white' : '#9ca3af',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Console Stream
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            style={{
              background: activeTab === 'flow' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'flow' ? 'white' : '#9ca3af',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Visual Pipeline Flow
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              fetchAuditLogs();
            }}
            style={{
              background: activeTab === 'audit' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'audit' ? 'white' : '#9ca3af',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📜 Audit Trail
          </button>
        </div>
      </div>

      {activeTab === 'terminal' && (
        <div style={{
          background: '#05070b',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1rem',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.85rem',
          color: '#34d399',
          height: '300px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          {logs.length === 0 ? (
            <div>[System] FastApply agent core initialized. Ready for application tasks.</div>
          ) : (
            logs.map((l, idx) => {
              let color = '#34d399';
              if (l.includes('⚠️')) color = '#fbbf24';
              if (l.includes('❌')) color = '#f87171';
              if (l.includes('[AgentCore]')) color = '#60a5fa';
              if (l.includes('[RealJobScraper]')) color = '#a78bfa';
              return <div key={idx} style={{ color }}>{l}</div>;
            })
          )}
        </div>
      )}

      {activeTab === 'flow' && (
        <div style={{
          background: '#05070b',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span>{agentState.stepName || 'Ready for Task'}</span>
              <span>{agentState.progressPercent || 0}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${agentState.progressPercent || 0}%`, background: 'linear-gradient(90deg, #60a5fa, #34d399)', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Active Target Job</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{agentState.currentJobTitle || 'No job currently in process'}</div>
            <div style={{ fontSize: '0.85rem', color: '#60a5fa' }}>{agentState.currentCompany ? `${agentState.currentCompany} • ${agentState.currentUrl}` : 'Initiate a job search above to queue jobs'}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af' }}>
            <span>🌐 Browser: <strong style={{ color: 'white' }}>Playwright Stealth</strong></span>
            <span>🤖 Provider: <strong style={{ color: '#60a5fa' }}>{activeProvider.toUpperCase()}</strong></span>
            <span>🧠 QA Engine: <strong style={{ color: '#34d399' }}>SQLite Active</strong></span>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{
          background: '#05070b',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1rem',
          fontSize: '0.85rem',
          color: '#60a5fa',
          height: '300px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          {auditLogs.length === 0 ? (
            <div>[Audit] No security audit logs recorded yet.</div>
          ) : (
            auditLogs.map((l) => (
              <div key={l.id}>
                <span style={{ color: '#9ca3af' }}>[{new Date(l.created_at).toLocaleTimeString()}]</span>{' '}
                <strong style={{ color: '#60a5fa' }}>[{l.action}]</strong> {l.details}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
