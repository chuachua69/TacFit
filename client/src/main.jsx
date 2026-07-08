import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { fxTap, unlockAudio } from './lib/feedback'

// Global UI interaction listener
document.addEventListener('click', (e) => {
  const isInteractive = e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]');
  if (isInteractive) {
    unlockAudio();
    fxTap();
  }
}, { capture: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
