import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { charStore, ITEMS, LEVEL_XP } from '../store/character';
import PixelCharacter from '../components/PixelCharacter';

const SLOTS = ['head', 'face', 'body'];
const SLOT_LABELS = { head: 'Head', face: 'Face', body: 'Body' };

export default function Wardrobe() {
  const navigate = useNavigate();
  const [char, setChar] = useState(charStore.get());
  const [activeSlot, setActiveSlot] = useState('head');
  const [preview, setPreview] = useState(null);

  const previewEquipped = preview
    ? { ...char.equipped, [ITEMS.find(i => i.id === preview)?.slot]: preview }
    : char.equipped;

  const equip = (itemId) => {
    charStore.equip(itemId);
    setChar(charStore.get());
    setPreview(null);
  };

  const slotItems = ITEMS.filter(i => i.slot === activeSlot);
  const progress = charStore.levelProgress(char);
  const nextLevel = char.level < LEVEL_XP.length - 1 ? LEVEL_XP[char.level + 1] : null;

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', gap: '1.25rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Wardrobe</div>
      </div>

      {/* Character preview + stats */}
      <div className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <PixelCharacter equipped={previewEquipped} size={2.5} />
          {preview && (
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>PREVIEW</div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Level {char.level}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{char.xp} XP</div>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
          </div>
          {nextLevel && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {nextLevel - char.xp} XP to Level {char.level + 1}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {char.owned.length} items unlocked
          </div>
        </div>
      </div>

      {/* Slot tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {SLOTS.map(slot => (
          <button key={slot}
            onClick={() => { setActiveSlot(slot); setPreview(null); }}
            style={{
              flex: 1, padding: '0.5rem 0', borderRadius: 'var(--radius)',
              background: activeSlot === slot ? 'var(--accent)' : 'var(--bg-elevated)',
              color: activeSlot === slot ? '#000' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.85rem',
            }}>
            {SLOT_LABELS[slot]}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slotItems.map(item => {
          const owned = char.owned.includes(item.id);
          const isEquipped = char.equipped[item.slot] === item.id;
          const isPreviewing = preview === item.id;
          const locked = !owned;

          return (
            <div key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '0.875rem',
                background: isEquipped ? 'var(--accent)15' : 'var(--bg-card)',
                border: `1px solid ${isEquipped ? 'var(--accent)' : isPreviewing ? 'var(--accent)60' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                opacity: locked ? 0.5 : 1,
              }}>
              {/* Color swatch */}
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: item.color,
                border: '2px solid rgba(255,255,255,0.1)',
                flexShrink: 0,
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</div>
                {locked ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🔒 Unlocks at Level {item.unlockLevel}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.slot} · Level {item.unlockLevel}
                  </div>
                )}
              </div>

              {!locked && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isEquipped && (
                    <button
                      onClick={() => setPreview(isPreviewing ? null : item.id)}
                      style={{
                        padding: '0.35rem 0.7rem', borderRadius: 'var(--radius)',
                        background: isPreviewing ? 'var(--accent)20' : 'var(--bg-elevated)',
                        border: `1px solid ${isPreviewing ? 'var(--accent)' : 'var(--border)'}`,
                        fontSize: '0.8rem', fontWeight: 600,
                        color: isPreviewing ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                      Try
                    </button>
                  )}
                  <button
                    onClick={() => equip(item.id)}
                    style={{
                      padding: '0.35rem 0.7rem', borderRadius: 'var(--radius)',
                      background: isEquipped ? 'var(--accent)' : 'var(--bg-elevated)',
                      border: `1px solid ${isEquipped ? 'var(--accent)' : 'var(--border)'}`,
                      fontSize: '0.8rem', fontWeight: 700,
                      color: isEquipped ? '#000' : 'var(--text)',
                    }}>
                    {isEquipped ? '✓ On' : 'Wear'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
