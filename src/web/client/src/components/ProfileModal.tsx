import React, { useState } from 'react';
import { CandidateFacts } from '../App';

interface ProfileModalProps {
  candidate: CandidateFacts | null;
  getHeaders: () => Record<string, string>;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  candidate,
  getHeaders,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState(candidate?.fullName || 'Sourabh Rustagi');
  const [roleTitle, setRoleTitle] = useState(candidate?.roleTitle || 'Chief Systems & DevOps Engineer');
  const [email, setEmail] = useState(candidate?.email || 'sourabh.rustagi@hotmail.com');
  const [phone, setPhone] = useState(candidate?.phone || '+91 8470894772');
  const [yearsExperience, setYearsExperience] = useState(candidate?.yearsExperience || 12);
  const [location, setLocation] = useState(candidate?.location || 'New Delhi, India / Remote');
  const [summary, setSummary] = useState(candidate?.summary || '');

  const handleSave = async () => {
    try {
      const res = await fetch('/api/candidate/update', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName,
          roleTitle,
          email,
          phone,
          yearsExperience,
          location,
          summary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
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
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>👤 Candidate Profile & Executive Facts</h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          View and edit all candidate profile facts used by the agent during automated job applications.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Primary Job Title:</label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Email Address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Phone Number:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Years Experience:</label>
            <input
              type="number"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Location:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 1rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>Professional Summary:</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: '100%', height: '70px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'white', padding: '0.5rem 1rem', marginTop: '0.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: 'white',
              padding: '0.6rem 1.25rem',
              borderRadius: '9999px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            💾 Save Candidate Profile
          </button>
        </div>
      </div>
    </div>
  );
};
