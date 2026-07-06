/** Compact tier pill — colour + icon + label. */
export default function TierBadge({ tier, big = false }) {
  if (!tier) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: big ? '6px 14px' : '3px 10px',
      borderRadius: 999,
      fontSize: big ? '0.95rem' : '0.72rem', fontWeight: 800,
      letterSpacing: '0.02em', textTransform: 'uppercase',
      background: `color-mix(in srgb, ${tier.color} 18%, transparent)`,
      color: tier.color,
      border: `1px solid color-mix(in srgb, ${tier.color} 55%, transparent)`,
    }}>
      <span>{tier.icon}</span>{tier.label}
    </span>
  );
}
