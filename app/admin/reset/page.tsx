'use client'

import { useState, useEffect } from 'react';

interface DatabaseStatus {
  success: boolean;
  statistics?: {
    total_users: number;
    total_reimbursements: number;
  };
  users?: Array<{ id: string; name: string; email: string; role: string }>;
  message?: string;
}

export default function ResetPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Fetch database status on load
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reset');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWipeDatabase = async () => {
    if (!confirmed || !window.confirm('⚠️ YAKIN?? Ini akan MENGHAPUS SEMUA DATA!\n\nIni tidak bisa di-undo!')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'WIPE_ALL_DATA' })
      });
      const data = await res.json();
      alert('✅ ' + data.message + '\n\nReimbursements: ' + data.details.reimbursements_deleted + '\nUsers: ' + data.details.users_deleted);
      setConfirmed(false);
      checkStatus();
    } catch (error) {
      alert('❌ Error: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🗑️ Database Management</h1>

      {/* Status Card */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
        <h2>📊 Database Status</h2>
        {loading && status === null ? (
          <p>Loading...</p>
        ) : status?.success ? (
          <>
            <p><strong>Total Users:</strong> {status.statistics?.total_users}</p>
            <p><strong>Total Reimbursements:</strong> {status.statistics?.total_reimbursements}</p>

            {status.users && status.users.length > 0 && (
              <div>
                <h3>Users in Database:</h3>
                <ul>
                  {status.users.map((user) => (
                    <li key={user.id}>
                      <strong>{user.name}</strong> ({user.email}) - {user.role}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p>❌ Error: {status?.message}</p>
        )}
      </div>

      {/* Wipe Database Card */}
      <div style={{ border: '2px solid #ff6b6b', padding: '20px', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
        <h2>⚠️ Danger Zone: Wipe Database</h2>
        <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
          This will DELETE all users and reimbursements. This action CANNOT be undone!
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading}
            />
            {' '} I understand this will permanently delete all data
          </label>
        </div>

        <button
          onClick={handleWipeDatabase}
          disabled={!confirmed || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: confirmed ? '#ff6b6b' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Processing...' : '🗑️ WIPE ALL DATA'}
        </button>
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={checkStatus}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
}
