import React from 'react';
import { JobPosting } from '../App';

interface SwipeCardDeckProps {
  job: JobPosting | undefined;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onOpenResumeModal: () => void;
}

export const SwipeCardDeck: React.FC<SwipeCardDeckProps> = ({
  job,
  onSwipeRight,
  onSwipeLeft,
  onOpenResumeModal,
}) => {
  const targetUrl = job ? (job.url || job.job_url) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <div style={{
        background: 'rgba(22, 30, 46, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        width: '100%',
        height: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(96, 165, 250, 0.3)'
            }}>
              {job ? (job.salary || '$160k - $240k') : 'Queue Empty'}
            </div>

            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open direct application page: ${targetUrl}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                  border: '1px solid #60a5fa',
                  color: '#60a5fa',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}
              >
                🔗 Apply Manually ↗
              </a>
            )}
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, marginTop: '0.5rem' }}>
            {job ? job.title : 'No Active Jobs in Queue'}
          </div>

          <div style={{ fontSize: '1.1rem', color: '#9ca3af', fontWeight: 600, marginTop: '0.25rem' }}>
            {job ? `${job.company} • ${job.location || 'Remote'}` : 'Select platforms & click Initiate Search above.'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {job && (job.tags || ['DevOps', 'Cloud', 'Automation']).map((t: string) => (
              <span key={t} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#d1d5db'
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.5 }}>
          {job ? (
            `Click Apply to launch Playwright autonomous auto-filler or click 'Apply Manually' to open the direct application link in your browser.`
          ) : (
            `Upload your PDF resume & portfolio link, select target job platforms, and click 'Initiate Search' to discover real jobs for your profile!`
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', width: '100%', marginTop: '0.5rem' }}>
        <button
          onClick={onSwipeLeft}
          title="Skip Job (Left)"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(22, 30, 46, 0.75)',
            color: 'white',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          ❌
        </button>

        <button
          onClick={onSwipeRight}
          title="Auto Apply (Right)"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(22, 30, 46, 0.75)',
            color: 'white',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          💚
        </button>
      </div>
    </div>
  );
};
