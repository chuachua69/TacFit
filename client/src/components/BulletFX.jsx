import { useState, useEffect, useRef } from 'react';

/**
 * Periodic tracer fly-by overlay. Fires a glowing tracer streak across the
 * screen every ~30s (plus one shortly after mount). Purely decorative.
 */
export default function BulletFX({ interval = 30000 }) {
  const [shots, setShots] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    let timers = [];
    const fire = () => {
      const id = ++idRef.current;
      const top = 12 + Math.random() * 64;          // vertical position %
      const reverse = Math.random() > 0.5;           // direction
      const tilt = (Math.random() * 8 - 4).toFixed(1); // slight angle
      setShots(s => [...s, { id, top, reverse, tilt }]);
      const t = setTimeout(() => setShots(s => s.filter(x => x.id !== id)), 1400);
      timers.push(t);
    };

    const first = setTimeout(fire, 3500);
    const iv = setInterval(fire, interval);
    timers.push(first);

    return () => {
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, [interval]);

  return (
    <div className="bullet-layer">
      {shots.map(s => (
        <span
          key={s.id}
          className="tracer"
          style={{
            top: `${s.top}%`,
            transform: `rotate(${s.tilt}deg)`,
            animationDirection: s.reverse ? 'reverse' : 'normal',
          }}
        />
      ))}
    </div>
  );
}
