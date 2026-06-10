import { useState, useEffect, useRef } from 'react';

/**
 * Random projectile fly-by overlay. Every 30–45s a random entity enters and
 * does its thing: a bullet streaks across, a bomb/grenade drops & explodes,
 * a torpedo runs across & detonates, or a cat hops in then dashes off.
 * Purely decorative; pointer-events:none; respects reduced-motion via CSS.
 */
const TYPES = ['bullet', 'bomb', 'grenade', 'torpedo', 'cat'];
const LIFETIME = 2600;

export default function BulletFX({ minDelay = 30000, maxDelay = 45000 }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  const timers = useRef([]);

  useEffect(() => {
    let alive = true;
    const push = (t) => { timers.current.push(t); return t; };

    const spawn = () => {
      const id = ++idRef.current;
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const top = 14 + Math.random() * 50;   // vertical %
      const x = 20 + Math.random() * 56;      // horizontal % (drop types)
      const flip = Math.random() > 0.5;
      setItems(s => [...s, { id, type, top, x, flip }]);
      push(setTimeout(() => alive && setItems(s => s.filter(i => i.id !== id)), LIFETIME));
    };

    const loop = () => {
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      push(setTimeout(() => { if (!alive) return; spawn(); loop(); }, delay));
    };

    push(setTimeout(spawn, 4000)); // first one shortly after load
    loop();

    return () => { alive = false; timers.current.forEach(clearTimeout); };
  }, [minDelay, maxDelay]);

  return (
    <div className="bullet-layer">
      {items.map(it => <FX key={it.id} {...it} />)}
    </div>
  );
}

function FX({ type, top, x, flip }) {
  const base = { top: `${top}%`, transform: flip ? 'scaleX(-1)' : 'none' };

  if (type === 'bullet') {
    return <div className="fx-item" style={base}><span className="fx-tracer" /></div>;
  }

  if (type === 'torpedo') {
    return (
      <div className="fx-item" style={base}>
        <span className="fx-torpedo">🚀</span>
        <span className="fx-boom fx-boom-mid">💥</span>
      </div>
    );
  }

  if (type === 'cat') {
    return (
      <div className="fx-item" style={base}>
        <span className="fx-cat">🐱</span>
        <span className="fx-puff">💨</span>
      </div>
    );
  }

  // bomb / grenade — drop from above at x, then explode
  const emoji = type === 'bomb' ? '💣' : '🧨';
  return (
    <div className="fx-item" style={{ top: `${top}%`, left: `${x}%` }}>
      <span className="fx-drop">{emoji}</span>
      <span className="fx-boom">💥</span>
    </div>
  );
}
