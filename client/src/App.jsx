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
import { store, isGuest } from './store/profile';
import { setMuted, isMuted, unlockAudio, fxTap } from './lib/feedback';
import { isGuarded } from './lib/guard';
import { supabase } from './lib/supabase';
import { fetchCloudCustomExercises } from './lib/exerciseDb';
import { startAppTour } from './lib/tour';
import './styles/global.css';

// Runs the whole-app guided tour once — but only after the WOD schedule wizard
// is done (programStartDate set). Firing earlier put the tour's popovers on
// top of the wizard, pointing at elements that weren't on screen yet.
function TourRunner() {
  const navigate = useNavigate();
  useEffect(() => {
    if (store.getProfile().tutorialSeen) return;
    // Poll cheaply until the program is scheduled, then start once.
    // startAppTour has its own singleton guard, so a double-invoke is harmless.
    const iv = setInterval(() => {
      const p = store.getProfile();
      if (p.tutorialSeen) { clearInterval(iv); return; }
      if (p.programStartDate) {
        clearInterval(iv);
        setTimeout(() => startAppTour(navigate), 600);
      }
    }, 800);
    return () => clearInterval(iv);
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
        fetchCloudCustomExercises(); // custom exercises too, so recovery math is right on a new device
        setSetupComplete(store.getProfile().setupComplete);
      }
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Restore from cloud ONLY on real sign-ins. TOKEN_REFRESHED fires ~hourly
      // and blindly overwriting local data with the cloud row on every refresh
      // erased any workout whose background sync had previously failed (offline
      // gym use = permanent data loss).
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        await store.fetchProfile();
        fetchCloudCustomExercises();
        setSetupComplete(store.getProfile().setupComplete);
      } else if (event === 'SIGNED_OUT') {
        // Only an actual sign-out resets setup. INITIAL_SESSION fires with a
        // null session for guests too — resetting there re-onboarded
        // dev-bypass users on every reload.
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
    // Warn before an accidental refresh / tab-close ONLY while a workout is in
    // progress — prompting on every refresh trains users to ignore the dialog.
    const onBeforeUnload = (e) => { if (!isGuarded()) return; e.preventDefault(); e.returnValue = ''; };
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

  // Two ways past the login screen without a session:
  //  - guest mode (production): the app runs entirely on localStorage, so
  //    sign-in is only needed for cross-device sync. This is also what lets a
  //    Play reviewer see the app without us handing out account credentials.
  //  - dev_bypass: dev builds only; Vite dead-code-eliminates the branch.
  if (!session && !isGuest() && !(import.meta.env.DEV && localStorage.getItem('dev_bypass'))) {
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
