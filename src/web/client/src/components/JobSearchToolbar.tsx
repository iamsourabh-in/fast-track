import React, { useState } from 'react';
import { JobPosting } from '../App';
import { Search, Link as LinkIcon, Briefcase, Rocket } from 'lucide-react';

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
    <div className="glass-panel animate-fade-in stagger-1" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
          <Search size={20} className="text-gradient" /> Initiate Job Discovery
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: chkLinkedIn ? '#fff' : 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={chkLinkedIn}
              onChange={(e) => setChkLinkedIn(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
            />
            LinkedIn
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: chkIndeed ? '#fff' : 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={chkIndeed}
              onChange={(e) => setChkIndeed(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
            />
            Indeed
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: chkNaukri ? '#fff' : 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={chkNaukri}
              onChange={(e) => setChkNaukri(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
            />
            Naukri
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Briefcase size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Role title or keywords..."
          />
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <LinkIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="url"
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Optional: Custom career portal URL (e.g., https://stripe.com/jobs)"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={isSearching}
          style={{ whiteSpace: 'nowrap' }}
        >
          {isSearching ? '⏳ Scraper Running...' : <><Rocket size={16}/> Fetch Jobs</>}
        </button>
      </div>
    </div>
  );
};
