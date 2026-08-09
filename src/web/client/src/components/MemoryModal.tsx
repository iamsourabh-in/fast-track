import React, { useState, useEffect } from 'react';

interface MemoryItem {
  id: number;
  question_raw: string;
  answer: string;
  usage_count: number;
}

interface MemoryModalProps {
  getHeaders: () => Record<string, string>;
  onClose: () => void;
  onUpdateStats: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  getHeaders,
  onClose,
  onUpdateStats,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [editAnswers, setEditAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory/qa', { headers: getHeaders() });
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
        const map: Record<number, string> = {};
        data.memories.forEach((m: MemoryItem) => {
          map[m.id] = m.answer;
        });
        setEditAnswers(map);
      }
    } catch {}
  };

  const handleSaveItem = async (id: number) => {
    const answer = editAnswers[id];
    await fetch('/api/memory/qa/update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, answer }),
    });
    fetchMemories();
    onUpdateStats();
  };

  const handleDeleteItem = async (id: number) => {
    await fetch(`/api/memory/qa/${id}`, { method: 'DELETE', headers: getHeaders() });
    fetchMemories();
    onUpdateStats();
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all cached Q&A memories?')) return;
    await fetch('/api/memory/qa/clear', { method: 'POST', headers: getHeaders() });
    fetchMemories();
    onUpdateStats();
  };

  const filteredMemories = memories.filter(
    (m) =>
      m.question_raw.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.answer.toLowerCase().includes(filterQuery.toLowerCase())
  );

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>🧠 Candidate Q&A Memory Bank</h2>
          <button
            onClick={handleClearAll}
            style={{
              background: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '0.4rem 0.8rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            🧹 Reset / Clear All
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          View, edit, and manage cached form answers used by the agent during auto-application.
        </p>

        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="🔍 Filter memory questions or answers..."
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'white'
          }}
        />

        <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Question</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Answer</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Reuses</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemories.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>
                    No cached memories found.
                  </td>
                </tr>
              ) : (
                filteredMemories.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}><strong style={{ color: '#60a5fa' }}>{m.question_raw}</strong></td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input
                        type="text"
                        value={editAnswers[m.id] !== undefined ? editAnswers[m.id] : m.answer}
                        onChange={(e) => setEditAnswers({ ...editAnswers, [m.id]: e.target.value })}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          fontSize: '0.8rem',
                          width: '100%'
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#34d399' }}>
                        {m.usage_count}x
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleSaveItem(m.id)} title="Save Answer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>💾</button>
                        <button onClick={() => handleDeleteItem(m.id)} title="Delete Memory" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
