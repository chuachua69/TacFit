import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { store } from '../store/profile';

// A guided walkthrough of the WHOLE app. driver.js renders its overlay on
// document.body (not the React tree), so it survives route changes — we just
// navigate to the right tab, then re-highlight the element on it.
const STEPS = [
  {
    path: '/', element: '#tutorial-views',
    popover: {
      title: '1/6 · Your daily workout',
      description: 'The WOD tab is your training for the day. Toggle between Today, Tomorrow, or the full Week to see what\'s coming.',
      side: 'bottom', align: 'start',
    },
  },
  {
    path: '/', element: '.tutorial-session',
    popover: {
      title: '2/6 · Run a session',
      description: 'Tap any session card to open the logger — it shows the exact weight to lift (auto-calculated from your 1RM and the week of the cycle), logs your RPE, and runs rest / EMOM timers. You can also mark a session skipped.',
      side: 'top', align: 'start',
    },
  },
  {
    path: '/test', element: '#tour-test',
    popover: {
      title: '3/6 · The benchmark',
      description: 'The Test tab is the 5-event assessment. Run the full circuit for a scored tier, or log single events to set a baseline. Every 6 weeks you retest here to see how much stronger you\'ve got.',
      side: 'bottom', align: 'start',
    },
  },
  {
    path: '/progress', element: '#tour-progress',
    popover: {
      title: '4/6 · Track the trend',
      description: 'Progress shows your tier, your best result per event, and a skip-impact analysis — exactly what falling behind is costing you and how to make it up.',
      side: 'bottom', align: 'start',
    },
  },
  {
    path: '/settings', element: '#tour-settings',
    popover: {
      title: '5/6 · Your numbers',
      description: 'Settings holds your bodyweight, prescribed loads, and your 1RM / 8RM lift data. These drive every weight the program prescribes — keep them current.',
      side: 'bottom', align: 'start',
    },
  },
  {
    path: '/', element: '#tutorial-nav',
    popover: {
      title: '6/6 · Get to work',
      description: 'Move between WOD, Test, Progress, and Settings from here anytime. That\'s the whole app — grab your gear and let\'s go.',
      side: 'top', align: 'center',
    },
  },
];

// Singleton guard: React StrictMode / navigate-identity changes can invoke the
// starter twice; a second concurrent tour would fight the first (two overlays,
// popover stuck on step 1). Only ever run one.
let activeTour = null;

export function startAppTour(navigate) {
  if (activeTour) return activeTour;

  let idx = 0;
  let done = false;

  const d = driver({
    allowClose: true,
    overlayColor: 'rgba(0,0,0,0.75)',
    onNextClick: () => render(idx + 1),
    onPrevClick: () => render(idx - 1),
    onCloseClick: finish,
    onDestroyStarted: finish,
  });

  function finish() {
    if (done) return;
    done = true;
    activeTour = null;
    store.setProfile({ tutorialSeen: true });
    navigate('/');
    d.destroy();
  }

  function show(i) {
    const s = STEPS[i];
    d.highlight({
      element: s.element,
      popover: {
        ...s.popover,
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: i === STEPS.length - 1 ? 'Done' : 'Next →',
        prevBtnText: '← Back',
      },
    });
  }

  function render(i) {
    if (i < 0) return;               // already at the first step
    if (i >= STEPS.length) { finish(); return; } // past the last → done
    const needNav = STEPS[i].path !== STEPS[idx].path;
    idx = i;
    if (needNav) {
      navigate(STEPS[i].path);
      setTimeout(() => show(i), 450); // let the new tab mount first
    } else {
      show(i);
    }
  }

  activeTour = d;
  show(0);
  return d;
}
