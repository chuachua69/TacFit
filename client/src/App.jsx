import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Calculator from './pages/Calculator';
import History from './pages/History';
import Settings from './pages/Settings';
import ReloadPrompt from './components/ReloadPrompt';
import { store } from './store/profile';
import { setMuted } from './lib/feedback';
import './styles/global.css';

// Apply saved mute preference on load
setMuted(store.getProfile().muted);

export default function App() {
  return (
    <HashRouter>
      <ReloadPrompt />
      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
