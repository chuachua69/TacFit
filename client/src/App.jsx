import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Wod from './pages/Wod';
import Test from './pages/Test';
import Calculator from './pages/Calculator';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import ReloadPrompt from './components/ReloadPrompt';
import Auth from './components/Auth';
import Onboarding from './pages/Onboarding';
import { store } from './store/profile';
import { setMuted } from './lib/feedback';
import { isGuarded } from './lib/guard';
import { supabase } from './lib/supabase';
import './styles/global.css';

// Apply saved mute preference on load
setMuted(store.getProfile().muted);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(store.getProfile().setupComplete);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Warn before an accidental refresh / tab-close / app-exit.
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);

    // Absorb the browser / Android back button while a workout is in progress
    // so it doesn't discard the session. A sentinel entry gives us something
    // to pop; we immediately re-arm it.
    window.history.pushState(null, '', window.location.href);
    const onPop = () => {
      if (isGuarded()) window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  if (loading) {
    return <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!session && !localStorage.getItem('dev_bypass')) {
    return <Auth />;
  }

  if (!setupComplete) {
    return <Onboarding onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <HashRouter>
      <ReloadPrompt />
      <Routes>
        <Route path="/" element={<Wod />} />
        <Route path="/test" element={<Test />} />
        <Route path="/assessment" element={<Calculator />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
