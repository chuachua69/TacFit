import { useRef, useEffect, useState } from 'react';

/**
 * Post-workout share card. Renders a 1080×1080 summary to canvas and offers
 * to share via the native share sheet (Instagram, Stories, etc. on mobile).
 * Falls back to download + caption-copy on desktop / unsupported browsers.
 *
 * summary = { discipline, emoji, title, statLine, sub, date, level, rank }
 */
export default function ShareWorkout({ summary, onClose }) {
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const caption =
    `Mission complete — ${summary.title} ✅\n` +
    `${summary.statLine}\n${summary.sub}\n\n` +
    `#TACFIT #${summary.discipline} #fitness #training #military`;

  useEffect(() => { draw().then(setPreview); /* eslint-disable-next-line */ }, []);

  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const draw = async () => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const W = 1080, H = 1080;

    // Background
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#101510');
    g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Gold frame
    ctx.strokeStyle = '#c8a96e';
    ctx.lineWidth = 6;
    roundRect(ctx, 40, 40, W - 80, H - 80, 36);
    ctx.stroke();

    // Crosshair motif (top-right, subtle)
    ctx.strokeStyle = 'rgba(200,169,110,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(W - 150, 150, 54, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 150, 78); ctx.lineTo(W - 150, 222);
    ctx.moveTo(W - 222, 150); ctx.lineTo(W - 78, 150);
    ctx.stroke();
    ctx.fillStyle = '#c8a96e';
    ctx.beginPath(); ctx.arc(W - 150, 150, 9, 0, Math.PI * 2); ctx.fill();

    ctx.textAlign = 'center';

    // TACFIT wordmark
    ctx.fillStyle = '#c8a96e';
    ctx.font = '800 76px Inter, system-ui, sans-serif';
    ctx.fillText('TACFIT', W / 2, 175);

    // MISSION COMPLETE
    ctx.fillStyle = 'rgba(240,240,240,0.55)';
    ctx.font = '700 30px Inter, system-ui, sans-serif';
    ctx.fillText('M I S S I O N   C O M P L E T E', W / 2, 225);

    // Big discipline emoji
    ctx.font = '300px sans-serif';
    ctx.fillText(summary.emoji, W / 2, 560);

    // Title
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '800 70px Inter, system-ui, sans-serif';
    ctx.fillText(summary.title, W / 2, 690);

    // Stat line
    ctx.fillStyle = '#c8a96e';
    ctx.font = '600 46px Inter, system-ui, sans-serif';
    ctx.fillText(summary.statLine, W / 2, 760);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(160, 880); ctx.lineTo(W - 160, 880); ctx.stroke();

    // Footer row: rank (left) · date (right)
    ctx.font = '700 38px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText(`Lv ${summary.level} · ${summary.rank}`, 160, 960);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(240,240,240,0.6)';
    ctx.fillText(summary.date, W - 160, 960);

    // Sub (phase / week) centered
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(240,240,240,0.45)';
    ctx.font = '500 32px Inter, system-ui, sans-serif';
    ctx.fillText(summary.sub, W / 2, 1015);

    return c.toDataURL('image/png');
  };

  const getFile = () => new Promise((res) =>
    canvasRef.current.toBlob(b => res(new File([b], 'tacfit-workout.png', { type: 'image/png' })), 'image/png'));

  const share = async () => {
    setBusy(true); setMsg('');
    try {
      const file = await getFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption, title: 'TACFIT' });
        setMsg('Shared ✓');
      } else {
        downloadFallback(file);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') downloadFallback(await getFile());
    }
    setBusy(false);
  };

  const downloadFallback = (file) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = 'tacfit-workout.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    navigator.clipboard?.writeText(caption)
      .then(() => setMsg('Image saved & caption copied — open Instagram to post.'))
      .catch(() => setMsg('Image saved — open Instagram to post.'));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 320,
      background: 'rgba(0,0,0,0.9)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', gap: '1rem',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--accent)', textTransform: 'uppercase' }}>
        Session Logged ✓ — Share it
      </div>

      {/* Hidden full-res canvas */}
      <canvas ref={canvasRef} width={1080} height={1080} style={{ display: 'none' }} />

      {/* Preview */}
      {preview && (
        <img src={preview} alt="Workout summary"
          style={{ width: 'min(74vw, 320px)', borderRadius: 16, border: '1px solid var(--border)' }} />
      )}

      {msg && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: 320 }}>{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(82vw, 340px)' }}>
        <button className="btn btn-primary" onClick={share} disabled={busy}>
          {busy ? 'Preparing…' : '📸 Share to Instagram'}
        </button>
        <button className="btn btn-secondary" onClick={() => downloadFallbackThenClose()}>
          Save Image
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );

  function downloadFallbackThenClose() {
    getFile().then(downloadFallback);
  }
}
