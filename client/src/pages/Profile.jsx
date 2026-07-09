import { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { store } from '../store/profile';
import { supabase } from '../lib/supabase';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function Profile() {
  const [user, setUser] = useState(null);
  const profile = store.getProfile();
  const wodLogs = store.getWodLogs();
  const attempts = store.getAttempts();
  const done = wodLogs.filter(w => (w.status || 'done') === 'done').length;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    const keysToClear = [
      'tac5_profile',
      'tac5_attempts',
      'tac5_events',
      'tac5_wod',
      'tac5_exmem',
      'tac5_custom_exercises',
      'dev_bypass'
    ];
    keysToClear.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <PageHeader title="PROFILE" subtitle="Account & program" />

      {/* Account */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 999, flexShrink: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
        }}>
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }} />
            : '👤'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.user_metadata?.full_name || (user ? user.email : 'Guest')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user ? user.email : 'Not signed in — data stays on this device'}
          </div>
        </div>
      </div>

      {/* Program + training summary */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Program started', profile.programStartDate ? fmtDate(profile.programStartDate) : '—'],
          ['Sessions completed', done],
          ['Full assessments', attempts.length],
          ['Bodyweight', `${profile.bodyweight} ${profile.unit}`],
          ['Weight class', `${profile.loadClass} ${profile.unit}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      {user
        ? <button className="btn btn-secondary" onClick={signOut}>Sign out</button>
        : <button className="btn btn-primary" onClick={() => { localStorage.removeItem('dev_bypass'); window.location.reload(); }}>Sign in</button>}

      <BottomNav active="" />
    </div>
  );
}
