import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Wod from './pages/Wod';
import Test from './pages/Test';
import Calculator from './pages/Calculator';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import ReloadPrompt from './components/ReloadPrompt';
import { store } from './store/profile';
import { setMuted } from './lib/feedback';
import { isGuarded } from './lib/guard';
import './styles/global.css';

// Apply saved mute preference on load
setMuted(store.getProfile().muted);

export default function App() {
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
