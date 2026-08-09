import React, { useState } from 'react';
import { AuditItem } from '../App';
import { Terminal, Activity, ShieldCheck, PlayCircle, Layers, Globe } from 'lucide-react';

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

import { PipelineStepper } from './PipelineStepper';

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  auditLogs,
  agentState,
  activeProvider,
  fetchAuditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'flow' | 'audit'>('terminal');

  return (
    <div className="glass-panel animate-fade-in stagger-3" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Pipeline Stepper moved here to declutter main layout */}
      <PipelineStepper agentState={agentState} />

      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
          <Terminal size={18} className="text-gradient" /> Agent Console
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('terminal')}
            style={{
              background: activeTab === 'terminal' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              color: activeTab === 'terminal' ? '#fff' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'terminal' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Activity size={14} /> Stream
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            style={{
              background: activeTab === 'flow' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              color: activeTab === 'flow' ? '#fff' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'flow' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <PlayCircle size={14} /> Pipeline
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              fetchAuditLogs();
            }}
            style={{
              background: activeTab === 'audit' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              color: activeTab === 'audit' ? '#fff' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'audit' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <ShieldCheck size={14} /> Audit
          </button>
        </div>
      </div>

      {activeTab === 'terminal' && (
        <div style={{
          background: '#030712',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1rem',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8rem',
          color: '#34d399',
          height: '280px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {logs.length === 0 ? (
            <div>[System] FastApply agent core initialized. Ready for application tasks.</div>
          ) : (
            logs.map((l, idx) => {
              let color = '#34d399'; // Emerald
              if (l.includes('⚠️')) color = '#fbbf24'; // Amber
              if (l.includes('❌')) color = '#f87171'; // Red
              if (l.includes('[AgentCore]')) color = '#60a5fa'; // Blue
              if (l.includes('[RealJobScraper]')) color = '#a78bfa'; // Purple
              return <div key={idx} style={{ color }}>{l}</div>;
            })
          )}
        </div>
      )}

      {activeTab === 'flow' && (
        <div style={{
          background: '#030712',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1.5rem',
          height: '280px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div className="flex-between" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#fff' }}>
              <span>{agentState.stepName || 'Ready for Task'}</span>
              <span className="text-gradient">{agentState.progressPercent || 0}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${agentState.progressPercent || 0}%`, background: 'var(--gradient-primary)', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Target Job</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{agentState.currentJobTitle || 'No job currently in process'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
              {agentState.currentCompany ? `${agentState.currentCompany} • ${agentState.currentUrl}` : 'Initiate a job search above to queue jobs'}
            </div>
          </div>

          <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Globe size={14} color="#60a5fa" /> Browser: <strong style={{ color: 'white' }}>Playwright Stealth</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Layers size={14} color="#a78bfa" /> Provider: <strong style={{ color: 'white' }}>{activeProvider.toUpperCase()}</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={14} color="#34d399" /> Engine: <strong style={{ color: 'white' }}>MongoDB Active</strong></span>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{
          background: '#030712',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1rem',
          fontSize: '0.85rem',
          color: '#60a5fa',
          height: '280px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          {auditLogs.length === 0 ? (
            <div>[Audit] No security audit logs recorded yet.</div>
          ) : (
            auditLogs.map((l) => (
              <div key={l.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>[{new Date(l.created_at).toLocaleTimeString()}]</span>{' '}
                <strong style={{ color: 'var(--accent-primary)' }}>[{l.action}]</strong> <span style={{ color: 'var(--text-secondary)' }}>{l.details}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
