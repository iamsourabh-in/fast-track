import React, { useState } from 'react';

interface ResumeModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  inline?: boolean;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ token, onClose, onSuccess, inline = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSynthesize = async () => {
    if (!selectedFile && !websiteUrl) {
      setStatusMsg({ text: 'Please select a PDF resume file or enter a portfolio website URL.', isError: true });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ text: '⏳ Extracting and synthesizing PDF & Website sources with AI...', isError: false });

    const formData = new FormData();
    if (selectedFile) formData.append('resumePdf', selectedFile);
    if (websiteUrl) formData.append('url', websiteUrl);

    try {
      const res = await fetch('/api/resume/synthesize', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ text: `✅ Profile successfully synthesized for ${data.profile.fullName}!`, isError: false });
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setStatusMsg({ text: `❌ Error: ${data.error}`, isError: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ Request failed: ${err.message}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div style={{
      background: inline ? 'transparent' : '#0f1420',
      border: inline ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: inline ? '0' : '2rem',
      width: inline ? '100%' : '90%',
      maxWidth: inline ? '100%' : '750px',
      maxHeight: inline ? 'none' : '88vh',
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.25rem',
      boxShadow: inline ? 'none' : '0 25px 50px rgba(0,0,0,0.5)'
    }}>
      {!inline && <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>📄 Upload PDF Resume & Candidate Website</h2>}

      <div
        onClick={() => document.getElementById('pdfInput')?.click()}
        style={{
          border: '2px dashed rgba(96, 165, 250, 0.4)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center' as const,
          cursor: 'pointer',
          background: 'rgba(59, 130, 246, 0.03)'
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📥</div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Drag & drop your PDF Resume here, or click to browse
        </div>
        <div style={{ fontSize: '0.8rem', color: selectedFile ? '#60a5fa' : '#9ca3af', marginTop: '0.25rem' }}>
          {selectedFile ? `📄 ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'Supports .PDF (Max 10MB)'}
        </div>
        <input
          id="pdfInput"
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af' }}>Portfolio / Website URL (Optional):</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white'
          }}
        />
      </div>

      {statusMsg && (
        <div style={{
          fontSize: '0.85rem',
          textAlign: 'center' as const,
          padding: '0.75rem',
          borderRadius: '12px',
          background: statusMsg.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: statusMsg.isError ? '#f87171' : '#34d399'
        }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: inline ? 'center' : 'space-between', alignItems: 'center', gap: '1rem' }}>
        {!inline && (
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSynthesize}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            color: 'white',
            padding: '0.75rem 2rem',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? '⏳ AI Parsing...' : '🚀 Parse & Build My Profile'}
        </button>
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      {content}
    </div>
  );
};
