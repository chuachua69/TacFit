import { useRef, useState } from 'react';
import { parseActivityFile, readFileText } from '../lib/activityFile';
import { fmtTime } from './WheelPicker';

/**
 * Button that reads a GPX/TCX activity file and reports the parsed result.
 *   onParsed(result)  result = { distanceM, durationS, paceSecPerKm, sport, format }
 *   label   button text
 *   variant 'swim' shows pace per 100m instead of per km in the status line
 */
export default function FileImport({ onParsed, label = 'Import GPX / TCX file', variant, hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok, msg }

  const handle = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setBusy(true); setStatus(null);
    try {
      const text = await readFileText(file);
      const r = parseActivityFile(text, file.name);
      const km = (r.distanceM / 1000).toFixed(2);
      const pace = variant === 'swim'
        ? `${fmtTime(r.paceSecPerKm / 10)}/100m`
        : `${fmtTime(r.paceSecPerKm)}/km`;
      setStatus({ ok: true, msg: `Read ${km} km · ${fmtTime(r.durationS)} · ${pace}` });
      onParsed(r);
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Could not read file.' });
    }
    setBusy(false);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,.tcx,.xml,application/gpx+xml"
        onChange={handle}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
        {busy ? 'Reading…' : `📂 ${label}`}
      </button>
      {hint && !status && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{hint}</div>
      )}
      {status && (
        <div style={{ fontSize: '0.78rem', marginTop: 6, color: status.ok ? 'var(--success)' : 'var(--danger)' }}>
          {status.ok ? '✓ ' : '⚠ '}{status.msg}
        </div>
      )}
    </div>
  );
}
