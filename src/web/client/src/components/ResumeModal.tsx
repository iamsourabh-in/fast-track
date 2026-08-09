import React, { useState } from 'react';

interface ResumeModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ token, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('https://iamsourabh.in/');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSynthesize = async () => {
    if (!selectedFile && !websiteUrl) {
      alert('Please select a PDF resume file or enter a portfolio website URL.');
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
      <div style={{
        background: '#0f1420',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        width: '90%',
        maxWidth: '750px',
        maxHeight: '88vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>📄 Upload PDF Resume & Candidate Website</h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Upload your PDF resume document and optionally add your personal portfolio link (`https://iamsourabh.in/`). FastApply AI will synthesize both into candidate profile memory.
        </p>

        <div
          onClick={() => document.getElementById('pdfInput')?.click()}
          style={{
            border: '2px dashed rgba(96, 165, 250, 0.4)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af' }}>Candidate Website URL (Optional):</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
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
            fontSize: '0.8rem',
            textAlign: 'center',
            color: statusMsg.isError ? '#f87171' : '#34d399'
          }}>
            {statusMsg.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSynthesize}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              color: 'white',
              padding: '0.6rem 1.25rem',
              borderRadius: '9999px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isLoading ? '⏳ Processing...' : '✨ Synthesize & Parse Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
