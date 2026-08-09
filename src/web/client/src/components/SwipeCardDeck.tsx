import React from 'react';
import { JobPosting } from '../App';
import { ExternalLink, Check, X } from 'lucide-react'; // I'll use Lucide icons for better UX

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
      
      <div className="glass-panel animate-slide-up" style={{ 
        width: '100%', 
        height: '520px', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow for the card */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'var(--accent-primary)',
          opacity: 0.1,
          filter: 'blur(50px)',
          borderRadius: '50%'
        }} />

        {job ? (
          <>
            <div className="flex-between" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
              <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                {job.salary || '$160k - $240k'}
              </span>
              
              {targetUrl && (
                <a 
                  href={targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  Apply Manually <ExternalLink size={14} style={{ marginLeft: '4px' }}/>
                </a>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
                {job.title}
              </h2>
              
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '1.5rem' }}>
                {job.company} <span style={{ opacity: 0.5, margin: '0 8px' }}>•</span> {job.location || 'Remote'}
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {(job.tags || ['DevOps', 'Cloud', 'Automation']).map((t: string) => (
                  <span key={t} className="badge">
                    {t}
                  </span>
                ))}
              </div>

              {job.description && (
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.6,
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  {job.description}
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
              Swipe Right to auto-apply, Swipe Left to skip.
            </div>
          </>
        ) : (
          <div className="flex-center" style={{ flexDirection: 'column', height: '100%', textAlign: 'center', gap: '1.5rem' }}>
            <div style={{ fontSize: '3rem', opacity: 0.5 }}>🔍</div>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>Queue Empty</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
                Upload your resume, select target platforms, and click <strong>Initiate Search</strong> to discover real jobs.
              </p>
            </div>
            <button className="btn btn-primary" onClick={onOpenResumeModal}>
              Update Profile
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        <button
          onClick={onSwipeLeft}
          disabled={!job}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: job ? 'pointer' : 'not-allowed',
            opacity: job ? 1 : 0.5,
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-lg)'
          }}
          onMouseOver={(e) => { if(job) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if(job) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <X size={32} strokeWidth={3} />
        </button>

        <button
          onClick={onSwipeRight}
          disabled={!job}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: job ? 'pointer' : 'not-allowed',
            opacity: job ? 1 : 0.5,
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-lg)'
          }}
          onMouseOver={(e) => { if(job) { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if(job) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <Check size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
