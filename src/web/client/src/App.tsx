import React, { useState, useEffect, useCallback } from 'react';
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
  id: string;
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
  id?: string;
  company: string;
  title: string;
  location?: string;
  url?: string;
  job_url?: string;
  salary?: string;
  description?: string;
  tags?: string[];
  status?: string;
}

export interface HistoryItem {
  id: string;
  company: string;
  title: string;
  apply_mode?: string;
  status: string;
  applied_at: string;
}

export interface AuditItem {
  id: string;
  action: string;
  details: string;
  createdAt?: string;
  created_at?: string;
}

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('fastapply_token') || '');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

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

  const getHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, [token]);

  // Fetch functions
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/stats', { headers: getHeaders() });
      if (res.status === 401) { handleLogout(); return; }
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
        else setCandidate(null);
      }
    } catch {}
  }, [token, getHeaders]);

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/swipe/feed', { headers: getHeaders() });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.jobs) {
        setJobFeed(data.jobs);
        setJobIndex(0);
      }
    } catch {}
  }, [token, getHeaders]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/history', { headers: getHeaders() });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.jobs) setHistory(data.jobs);
    } catch {}
  }, [token, getHeaders]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch {}
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/audit-logs', { headers: getHeaders() });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch {}
  }, [token, getHeaders]);

  const fetchAgentStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/status');
      const data = await res.json();
      if (data) setAgentState(data);
    } catch {}
  }, []);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchFeed();
    fetchHistory();
    fetchLogs();
    fetchAuditLogs();
    fetchAgentStatus();
  }, [fetchStats, fetchFeed, fetchHistory, fetchLogs, fetchAuditLogs, fetchAgentStatus]);

  const handleLogout = useCallback(() => {
    setToken('');
    setUser(null);
    setCandidate(null);
    setJobFeed([]);
    setHistory([]);
    setAuditLogs([]);
    localStorage.removeItem('fastapply_token');
  }, []);

  // 1. Initial auth check
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => {
          if (res.status === 401) { handleLogout(); setIsAuthChecked(true); return null; }
          return res.json();
        })
        .then(data => {
          if (data?.user) {
            setUser(data.user);
          } else {
            handleLogout();
          }
          setIsAuthChecked(true);
        })
        .catch(() => { handleLogout(); setIsAuthChecked(true); });
    } else {
      setIsAuthChecked(true);
    }
  }, []);

  // 2. Periodic polling (only when logged in)
  useEffect(() => {
    if (!user || !token) return;
    refreshAll();
    const intervalLogs = setInterval(fetchLogs, 2000);
    const intervalAgent = setInterval(fetchAgentStatus, 2000);
    const intervalStats = setInterval(fetchStats, 5000);
    const intervalHist = setInterval(fetchHistory, 5000);

    return () => {
      clearInterval(intervalLogs);
      clearInterval(intervalAgent);
      clearInterval(intervalStats);
      clearInterval(intervalHist);
    };
  }, [user, token]);

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

  // ─────────────────────────────────────────────────
  // RENDER FLOW:
  // 1. If not auth-checked yet, show loading
  // 2. If not logged in, show auth modal fullscreen
  // 3. If logged in but no candidate profile, show resume upload step
  // 4. If logged in and profile exists, show full dashboard
  // ─────────────────────────────────────────────────

  if (!isAuthChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '1.25rem', color: '#60a5fa' }}>
        ⏳ Loading FastApply Pro...
      </div>
    );
  }

  // Not logged in → show auth screen
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthModal
          hideCloseButton={true}
          onAuthSuccess={(newToken: string, newUser: UserProfile) => {
            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('fastapply_token', newToken);
          }}
        />
      </div>
    );
  }

  // Logged in but no candidate profile → show onboarding step
  if (!candidate) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          user={user}
          activeProvider={stats.activeProvider}
          activeMode={stats.mode}
          onOpenAuth={() => {}}
          onLogout={handleLogout}
          onResetDb={handleResetDatabase}
          onOpenProfile={() => {}}
          onOpenMemory={() => {}}
          onOpenResume={() => {}}
          onRefresh={refreshAll}
        />
        <main style={{ flex: 1, maxWidth: '700px', width: '100%', margin: '4rem auto', padding: '2rem' }}>
          <div style={{
            background: 'rgba(22, 30, 46, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '2.5rem',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              Welcome, {user.fullName}! Let's set up your profile.
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem', lineHeight: 1.6 }}>
              Upload your resume (PDF) and/or provide your portfolio website URL. Our AI will parse your background, skills, and experience to build your candidate memory bank.
            </p>
            <ResumeModal
              token={token}
              onClose={() => {}}
              onSuccess={() => {
                refreshAll();
              }}
              inline={true}
            />
          </div>
        </main>
      </div>
    );
  }

  // Full dashboard
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
