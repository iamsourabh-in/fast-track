import React, { useState } from 'react';
import { JobPosting } from '../App';

interface JobSearchToolbarProps {
  getHeaders: () => Record<string, string>;
  onSearchComplete: (jobs: JobPosting[]) => void;
}

export const JobSearchToolbar: React.FC<JobSearchToolbarProps> = ({
  getHeaders,
  onSearchComplete,
}) => {
  const [keywords, setKeywords] = useState('DevOps Engineer');
  const [customUrl, setCustomUrl] = useState('');
  const [chkLinkedIn, setChkLinkedIn] = useState(true);
  const [chkIndeed, setChkIndeed] = useState(true);
  const [chkNaukri, setChkNaukri] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    const platforms: string[] = [];
    if (chkLinkedIn) platforms.push('linkedin');
    if (chkIndeed) platforms.push('indeed');
    if (chkNaukri) platforms.push('naukri');

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ platforms, customCareerUrl: customUrl, query: keywords }),
      });
      const data = await res.json();
      if (data.jobs) {
        onSearchComplete(data.jobs);
      }
    } catch (err: any) {
      alert(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(22, 30, 46, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.25rem',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔍</span> Initiate Job Discovery Search
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={chkLinkedIn}
              onChange={(e) => setChkLinkedIn(e.target.checked)}
              style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
            />
            💼 LinkedIn
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={chkIndeed}
              onChange={(e) => setChkIndeed(e.target.checked)}
              style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
            />
            🎯 Indeed
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={chkNaukri}
              onChange={(e) => setChkNaukri(e.target.checked)}
              style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
            />
            🇮🇳 Naukri
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Role title or keywords..."
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white',
            width: '220px',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />

        <input
          type="url"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="Optional: Custom career portal URL (e.g., https://stripe.com/jobs)..."
          style={{
            flex: 1,
            padding: '0.55rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />

        <button
          onClick={handleSearch}
          disabled={isSearching}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            color: 'white',
            padding: '0.55rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {isSearching ? '⏳ Scraper Running...' : '🚀 Initiate Search & Fetch Jobs'}
        </button>
      </div>
    </div>
  );
};
