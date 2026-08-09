import React, { useState, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { JobPosting } from '../App';
import { ExternalLink, Check, X } from 'lucide-react'; 

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
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const controls = useAnimation();

  useEffect(() => {
    setSwipeDir(null);
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [job?.id, controls]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!job || swipeDir) return;
    setSwipeDir(direction);
    
    // Animate out
    await controls.start({
      x: direction === 'right' ? 300 : -300,
      opacity: 0,
      rotate: direction === 'right' ? 15 : -15,
      transition: { duration: 0.3 }
    });

    if (direction === 'right') {
      onSwipeRight();
    } else {
      onSwipeLeft();
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe('left');
    } else {
      // Snap back if not swiped far enough
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%', maxWidth: '420px', margin: '0 auto' }}>
      
      <motion.div 
        className="glass-panel"
        drag={job && !swipeDir ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        style={{ 
          width: '100%', 
          height: '520px', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
          cursor: job && !swipeDir ? 'grab' : 'default'
        }}
        whileTap={{ cursor: job && !swipeDir ? 'grabbing' : 'default' }}
      >
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'var(--accent-primary)',
          opacity: 0.1,
          filter: 'blur(50px)',
          borderRadius: '50%',
          pointerEvents: 'none'
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
      </motion.div>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        <button
          onClick={() => handleSwipe('left')}
          disabled={!job || swipeDir !== null}
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
            cursor: job && !swipeDir ? 'pointer' : 'not-allowed',
            opacity: job && !swipeDir ? 1 : 0.5,
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-lg)'
          }}
          onMouseOver={(e) => { if(job && !swipeDir) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if(job && !swipeDir) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <X size={32} strokeWidth={3} />
        </button>

        <button
          onClick={() => handleSwipe('right')}
          disabled={!job || swipeDir !== null}
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
            cursor: job && !swipeDir ? 'pointer' : 'not-allowed',
            opacity: job && !swipeDir ? 1 : 0.5,
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-lg)'
          }}
          onMouseOver={(e) => { if(job && !swipeDir) { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if(job && !swipeDir) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <Check size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
