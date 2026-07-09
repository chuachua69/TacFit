import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Wod from './pages/Wod';
import Test from './pages/Test';
import Calculator from './pages/Calculator';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Exercises from './pages/Exercises';
import History from './pages/History';
import Profile from './pages/Profile';
import ReloadPrompt from './components/ReloadPrompt';
import Drawer from './components/Drawer';
import Auth from './components/Auth';
import Onboarding from './pages/Onboarding';
import { store } from './store/profile';
import { setMuted, isMuted, unlockAudio, fxTap } from './lib/feedback';
import { isGuarded } from './lib/guard';
import { supabase } from './lib/supabase';
import { startAppTour } from './lib/tour';
import './styles/global.css';

// Runs the whole-app guided tour once, after onboarding. Lives inside the
// router so it can navigate between tabs as it highlights each one.
function TourRunner() {
  const navigate = useNavigate();
  useEffect(() => {
    // startAppTour has its own singleton guard, so a double-invoke is harmless.
    if (store.getProfile().tutorialSeen) return;
    const t = setTimeout(() => startAppTour(navigate), 500);
    return () => clearTimeout(t);
  }, [navigate]);
  return null;
}

// Apply saved mute preference on load
setMuted(store.getProfile().muted);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(store.getProfile().setupComplete);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await store.fetchProfile();
        setSetupComplete(store.getProfile().setupComplete);
      }
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await store.fetchProfile();
        setSetupComplete(store.getProfile().setupComplete);
      } else {
        setSetupComplete(false);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Universal tap feedback: every tap anywhere in the app gets a subtle
    // click + haptic (respects the Sound & haptics toggle). Also unlocks audio
    // on the first gesture so later cues can play on iOS/Safari.
    const onTap = () => {
      if (isMuted()) return;
      unlockAudio();
      fxTap();
    };
    document.addEventListener('click', onTap, true);
    return () => document.removeEventListener('click', onTap, true);
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
      <TourRunner />
      <Drawer />
      <Routes>
        <Route path="/" element={<Wod />} />
        <Route path="/test" element={<Test />} />
        <Route path="/assessment" element={<Calculator />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
