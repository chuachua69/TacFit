import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { storage } from './store/storage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import WeekView from './pages/WeekView';
import SessionDetail from './pages/SessionDetail';
import Overview from './pages/Overview';
import Settings from './pages/Settings';
import Assessment from './pages/Assessment';
import './styles/global.css';

function App() {
  const profile = storage.getProfile();
  const plan = storage.getPlan();
  const hasSetup = profile && plan;

  // Check if plan is complete (all sessions done or past)
  const isPlanComplete = hasSetup && (() => {
    const allSessions = plan.weeks.flatMap(w => w.sessions);
    const logs = storage.getLogs();
    const today = new Date().toISOString().split('T')[0];
    const lastSession = allSessions[allSessions.length - 1];
    return lastSession && lastSession.date < today &&
      logs.filter(l => l.status === 'done').length >= allSessions.length * 0.8;
  })();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          !hasSetup ? <Navigate to="/onboarding" replace /> :
          isPlanComplete ? <Navigate to="/assessment" replace /> :
          <Navigate to="/dashboard" replace />
        } />
        <Route path="/onboarding/*" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/week/:weekNum" element={<WeekView />} />
        <Route path="/session/:sessionId" element={<SessionDetail />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
