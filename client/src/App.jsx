import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Wod from './pages/Wod';
import Test from './pages/Test';
import Calculator from './pages/Calculator';
import Progress from './pages/Progress';
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
