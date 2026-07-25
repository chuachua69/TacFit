/**
 * Play Store asset capture.
 *
 * Drives the locally installed Chrome over the DevTools Protocol using only
 * Node built-ins (node 22+ has a global WebSocket), so this adds no puppeteer /
 * playwright dependency to the project.
 *
 * Renders at 540x960 with deviceScaleFactor 2 => exactly 1080x1920 PNGs, the
 * 9:16 phone-screenshot shape Play asks for, plus the 1024x500 feature graphic.
 *
 * The dev server must already be running (`npm run dev` in client/). It serves
 * under the '/TacFit/' base — see vite.config.js — not at the origin root.
 *
 * Usage:
 *   node scripts/shoot-store.mjs [seedFile] [outDir]
 */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);

const seedPath = process.argv[2] || join(here, 'store-seed.js');
const outDir = process.argv[3] || join(root, 'client', 'store', 'screenshots');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];
const CHROME = CHROME_CANDIDATES.find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome not found. Tried:\n' + CHROME_CANDIDATES.join('\n')); process.exit(1); }

const ORIGIN = 'http://localhost:5173';
const BASE = ORIGIN + '/TacFit/';
const PORT = 9333;

const clickButton = (label) =>
  `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)})?.click()`;

// Filename order == listing order.
const SHOTS = [
  { name: '01-wod-today', hash: '#/' },
  { name: '02-wod-week',  hash: '#/', prep: clickButton('Week') },
  { name: '03-test',      hash: '#/test' },
  { name: '04-progress',  hash: '#/progress' },
  { name: '05-exercises', hash: '#/exercises' },
];

const seed = readFileSync(seedPath, 'utf8');
const profileDir = join(tmpdir(), `tacfit-shoot-${process.pid}`);
mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--mute-audio',
  '--disable-extensions', '--disable-background-networking',
  '--force-color-profile=srgb',
  'about:blank',
], { stdio: 'ignore' });

class CDP {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map(); this.events = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method) {
        this.events.push(m);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => { if (this.pending.delete(id)) rej(new Error(`timeout: ${method}`)); }, 30000);
    });
  }
}

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* port not open yet */ }
    await sleep(250);
  }
  throw new Error('Chrome debug port never came up');
}

const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
const cdp = new CDP(ws);

const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => cdp.send(m, p, sessionId);

await S('Page.enable');
await S('Runtime.enable');
await S('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 2, mobile: true });
await S('Emulation.setScrollbarsHidden', { hidden: true });

async function waitForLoad() {
  cdp.events.length = 0;
  for (let i = 0; i < 80; i++) {
    if (cdp.events.some(e => e.method === 'Page.loadEventFired')) return;
    await sleep(100);
  }
}

async function evaluate(expression) {
  const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
}

// Land on the origin so localStorage is writable for it, then seed the demo state.
await S('Page.navigate', { url: BASE });
await waitForLoad();
// Evaluated at top level, not inside an IIFE, so the seed's trailing
// expression is what Runtime.evaluate hands back as the summary.
const summary = await evaluate(`localStorage.clear();\n${seed}`);
console.log('seeded:', JSON.stringify(summary));

for (const shot of SHOTS) {
  await evaluate(`location.hash = ${JSON.stringify(shot.hash)}`);
  await S('Page.reload', { ignoreCache: false });
  await waitForLoad();

  // Wait until React has painted something real, not the "Loading..." fallback.
  let ready = false;
  for (let i = 0; i < 60; i++) {
    const state = await evaluate(`(() => {
      const root = document.getElementById('root');
      const t = root ? root.innerText.trim() : '';
      return { len: t.length, loading: t === 'Loading...' };
    })()`);
    if (state.len > 40 && !state.loading) { ready = true; break; }
    await sleep(200);
  }
  if (shot.prep) { await evaluate(shot.prep); await sleep(500); }
  await sleep(900); // transitions / font settle

  const { data } = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(outDir, `${shot.name}.png`), Buffer.from(data, 'base64'));
  console.log(`${shot.name}.png  ready=${ready}`);
}

// Feature graphic — its own fixed 1024x500 spec, no device emulation.
await S('Emulation.setDeviceMetricsOverride', { width: 1024, height: 500, deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: BASE + 'store/feature-graphic.html' });
await waitForLoad();
await sleep(1200);
const fg = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(join(outDir, 'feature-graphic.png'), Buffer.from(fg.data, 'base64'));
console.log('feature-graphic.png');

ws.close();
chrome.kill();
await sleep(400);
try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows file lock */ }
console.log(`\nDone -> ${outDir}`);
