import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { JobSearchToolbar } from './components/JobSearchToolbar';
import { PipelineStepper } from './components/PipelineStepper';
import { SwipeCardDeck } from './components/SwipeCardDeck';
import { ConsolePanel } from './components/ConsolePanel';
import { HistoryTable } from './components/HistoryTable';
import { AuthModal } from './components/AuthModal';
import { ResumeModal } from './components/ResumeModal';
import { ProfileModal } from './components/ProfileModal';
import { MemoryModal } from './components/MemoryModal';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role?: string;
}

export interface CandidateFacts {
  fullName: string;
  roleTitle?: string;
  email: string;
  phone?: string;
  yearsExperience?: number;
  location?: string;
  summary?: string;
}

export interface JobPosting {
  id?: number;
  company: string;
  title: string;
  location?: string;
  url?: string;
  job_url?: string;
  salary?: string;
  tags?: string[];
  status?: string;
}

export interface HistoryItem {
  id: number;
  company: string;
  title: string;
  apply_mode?: string;
  status: string;
  applied_at: string;
}

export interface AuditItem {
  id: number;
  action: string;
  details: string;
  created_at: string;
}

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('fastapply_token') || '');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);

  // Data State
  const [stats, setStats] = useState({
    dailyApplied: 0,
    maxDaily: 250,
    qaTotalAnswers: 0,
    qaTotalReuses: 0,
    activeProvider: 'ollama',
    mode: 'autonomous',
  });
  const [candidate, setCandidate] = useState<CandidateFacts | null>(null);
  const [jobFeed, setJobFeed] = useState<JobPosting[]>([]);
  const [jobIndex, setJobIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [agentState, setAgentState] = useState({
    activeStep: 1,
    stepName: 'Ready for Task',
    progressPercent: 0,
    currentJobTitle: '',
    currentCompany: '',
    currentUrl: '',
  });

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // 1. Initial auth check
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: getHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  // 2. Periodic polling
  useEffect(() => {
    refreshAll();
    const intervalLogs = setInterval(fetchLogs, 1000);
    const intervalAgent = setInterval(fetchAgentStatus, 1000);
    const intervalStats = setInterval(fetchStats, 3000);
    const intervalHist = setInterval(fetchHistory, 3000);

    return () => {
      clearInterval(intervalLogs);
      clearInterval(intervalAgent);
      clearInterval(intervalStats);
      clearInterval(intervalHist);
    };
  }, [token]);

  const refreshAll = () => {
    fetchStats();
    fetchFeed();
    fetchHistory();
    fetchLogs();
    fetchAuditLogs();
    fetchAgentStatus();
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', { headers: getHeaders() });
      const data = await res.json();
      if (data) {
        setStats({
          dailyApplied: data.dailyApplied || 0,
          maxDaily: data.maxDaily || 250,
          qaTotalAnswers: data.qaTotalAnswers || 0,
          qaTotalReuses: data.qaTotalReuses || 0,
          activeProvider: data.activeProvider || 'ollama',
          mode: data.activeMode || 'autonomous',
        });
        if (data.candidate) setCandidate(data.candidate);
      }
    } catch {}
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/swipe/feed', { headers: getHeaders() });
      const data = await res.json();
      if (data.jobs) {
        setJobFeed(data.jobs);
        setJobIndex(0);
      }
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history', { headers: getHeaders() });
      const data = await res.json();
      if (data.jobs) setHistory(data.jobs);
    } catch {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs', { headers: getHeaders() });
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs', { headers: getHeaders() });
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch {}
  };

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch('/api/agent/status', { headers: getHeaders() });
      const data = await res.json();
      if (data) setAgentState(data);
    } catch {}
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('fastapply_token');
    setShowAuthModal(true);
  };

  const handleResetDatabase = async () => {
    if (!confirm('⚠️ Are you sure you want to flush the entire database? All candidate profiles, Q&A memories, jobs, and histories will be reset so you can start 100% fresh.')) {
      return;
    }
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        handleLogout();
        alert('💥 Database reset successfully! You can now register or log in fresh.');
      }
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const handleSwipeRight = async () => {
    if (jobIndex >= jobFeed.length) return;
    const job = jobFeed[jobIndex];
    await fetch('/api/swipe/right', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ job }),
    });
    setJobIndex(prev => prev + 1);
    refreshAll();
  };

  const handleSwipeLeft = async () => {
    if (jobIndex >= jobFeed.length) return;
    const job = jobFeed[jobIndex];
    await fetch('/api/swipe/left', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ job }),
    });
    setJobIndex(prev => prev + 1);
    refreshAll();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        user={user}
        activeProvider={stats.activeProvider}
        activeMode={stats.mode}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onResetDb={handleResetDatabase}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenMemory={() => setShowMemoryModal(true)}
        onOpenResume={() => setShowResumeModal(true)}
        onRefresh={refreshAll}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <MetricsCards
          stats={stats}
          candidate={candidate}
          onOpenMemory={() => setShowMemoryModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
        />

        <JobSearchToolbar
          getHeaders={getHeaders}
          onSearchComplete={(newJobs: JobPosting[]) => {
            setJobFeed(newJobs);
            setJobIndex(0);
            refreshAll();
          }}
        />

        <PipelineStepper agentState={agentState} />

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '2rem' }}>
          <SwipeCardDeck
            job={jobFeed[jobIndex]}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onOpenResumeModal={() => setShowResumeModal(true)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ConsolePanel
              logs={logs}
              auditLogs={auditLogs}
              agentState={agentState}
              activeProvider={stats.activeProvider}
              fetchAuditLogs={fetchAuditLogs}
            />

            <HistoryTable history={history} />
          </div>
        </div>
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(token: string, user: UserProfile) => {
            setToken(token);
            setUser(user);
            localStorage.setItem('fastapply_token', token);
            setShowAuthModal(false);
            refreshAll();
          }}
        />
      )}

      {showResumeModal && (
        <ResumeModal
          token={token}
          onClose={() => setShowResumeModal(false)}
          onSuccess={() => {
            setShowResumeModal(false);
            refreshAll();
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          candidate={candidate}
          getHeaders={getHeaders}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            setShowProfileModal(false);
            refreshAll();
          }}
        />
      )}

      {showMemoryModal && (
        <MemoryModal
          getHeaders={getHeaders}
          onClose={() => setShowMemoryModal(false)}
          onUpdateStats={fetchStats}
        />
      )}
    </div>
  );
}
