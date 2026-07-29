import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { startGuestSession } from '../store/profile';
import { Target } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Include the app's base path (/TacFit/ on GitHub Pages, / on Vercel)
        // so OAuth returns to where the app actually lives, not the bare domain root.
        redirectTo: window.location.origin + import.meta.env.BASE_URL
      }
    });
    if (error) console.error('Error logging in:', error.message);
    setLoading(false);
  };

  // Everything works offline from localStorage, so a guest gets the whole app.
  // Signing in later keeps that data: fetchProfile only overwrites local state
  // when a cloud row already exists, which it won't for a brand-new account.
  const handleGuest = () => {
    startGuestSession();
    window.location.reload();
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
          onClick={handleGuest}
          disabled={loading}
          style={{ padding: '0.9rem' }}
        >
          Continue without an account
        </button>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          Everything works offline either way. Signing in with Google just syncs
          your training across devices — you can do it later from Profile.
        </p>

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
