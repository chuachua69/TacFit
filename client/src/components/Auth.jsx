import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Activity } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error logging in:', error.message);
    setLoading(false);
  };

  const handleStravaLogin = async () => {
    alert('Strava integration requires Client ID/Secret configuration on the developer portal.');
  };

  const handleDevBypass = () => {
    localStorage.setItem('dev_bypass', '1');
    window.location.reload();
  };

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Target size={64} color="var(--accent)" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2.5rem', letterSpacing: '0.1em', fontWeight: 800 }}>TACFIT</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>Tactical Physical Assessment & Training</p>
      </div>

      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ padding: '1rem' }}
        >
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={handleStravaLogin}
          style={{ padding: '1rem' }}
        >
          <Activity size={18} /> Connect with Strava
        </button>

        {import.meta.env.DEV && (
          <button 
            className="btn btn-ghost" 
            onClick={handleDevBypass}
            style={{ marginTop: '1rem', fontSize: '0.8rem' }}
          >
            Bypass Login (Dev Mode Only)
          </button>
        )}
      </div>
    </div>
  );
}
