/**
 * PixelCharacter.jsx
 * Chibi low-poly military character — 1:1.4 head-to-body, faceted shading
 * ViewBox: 0 0 100 128  (UI overlay renders at y≥119 when showUI=true)
 *
 * Props
 *   headgear    'beret'|'helmet'|'boonie'|'none'
 *   hair        'crew_cut'|'undercut'|'shaved'
 *   showShades  boolean
 *   showStubble boolean
 *   physique    'lean'|'athletic'|'jacked'
 *   showVest    boolean
 *   pantsColor  'olive'|'tan'|'gray'
 *   footwear    'boots'|'shoes'|'none'
 *   level       number  (default 1)
 *   xp          number  (default 0)
 *   maxXp       number  (default 100)
 *   showUI      boolean (renders embedded level-bar overlay)
 *   equipped    {}      legacy compat
 *   size        number  width = 100*size, height = 128*size
 *   onClick     fn
 */

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  // Skin
  sk:'#e8b890', skM:'#d4a07a', skSh:'#b87850', skDk:'#9a6040',
  // Hair — medium brown
  hr:'#5c3a1e', hrH:'#7a5030', hrS:'#3e2410',
  // Eyes
  ew:'#f0ece0',        // sclera
  ir:'#3a2a18',        // iris dark brown
  pp:'#1a1008',        // pupil
  es:'#ffffff',        // shine
  el:'#2a1808',        // lid rim
  bw:'#3a2010',        // brow
  bl:'#e87060',        // blush
  // Uniform — olive green
  un:'#4a6035', unL:'#5c7844', unS:'#344825',
  // Pants colour variants
  ta:'#8a7a5a', taL:'#a09070', taS:'#6a5a3a',
  gy:'#585868', gyL:'#6a6878', gyS:'#3e3e4e',
  // Belt/buckle
  bt:'#6b4423', btS:'#4a2e14',
  bk:'#c8a040', bkH:'#e8c060', bkS:'#9a7010',
  // Boots — dark brown
  bo:'#4a2e14', boH:'#6a4e28', boS:'#2e1c0a', boSl:'#1e1408', boR:'#6a5438',
  // Tactical vest (coyote brown)
  vs:'#3e3420', vsS:'#2a2418', vsPo:'#302c18', vsPoE:'#4e4428',
  // Shades
  shd:'#162028', shdR:'#4a6878', shdG:'#7aafc8',
  // UI
  uiG:'#c8a040', uiT:'rgba(200,196,176,0.5)',
};

// Physique: torso x range, arm outer x
const PHY = {
  lean:     { tL:32, tR:68, aL:20, aR:80 },
  athletic: { tL:28, tR:72, aL:16, aR:84 },
  jacked:   { tL:24, tR:76, aL:12, aR:88 },
};

const PANTS = {
  olive:{ f:C.un,  l:C.unL, s:C.unS },
  tan:  { f:C.ta,  l:C.taL, s:C.taS },
  gray: { f:C.gy,  l:C.gyL, s:C.gyS },
};

const HG_MAP = {
  beret_green:'beret', helmet_mk6:'helmet',
  boonie_hat:'boonie', ops_helmet:'helmet',
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function PixelCharacter({
  headgear,  hair = 'crew_cut',
  showShades, showStubble = false,
  physique = 'athletic',
  showVest,  pantsColor = 'olive',
  footwear = 'boots',
  level = 1, xp = 0, maxXp = 100,
  showUI = false,
  equipped = {}, size = 1, onClick,
}) {
  // Map legacy equipped → new props (only when new prop is absent/undefined)
  const hg = headgear  !== undefined ? headgear  : (HG_MAP[equipped?.head] ?? 'none');
  const sv = showVest  !== undefined ? showVest  : (equipped?.body != null);
  const ss = showShades !== undefined ? showShades : (equipped?.face === 'visor_amber' || equipped?.face === 'nvg');

  const ph = PHY[physique] ?? PHY.athletic;
  const pc = PANTS[pantsColor] ?? PANTS.olive;

  const BAR_X = 25, BAR_W = 50;
  const barFill = Math.round(Math.min(1, xp / Math.max(1, maxXp)) * BAR_W);

  return (
    <svg
      width={100 * size} height={128 * size}
      viewBox="0 0 100 128"
      style={{ overflow:'visible', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >

      {/* ══════════════════════════════════════
          1. BOOTS  (drawn first, back layer)
          ══════════════════════════════════════ */}
      {footwear === 'boots' && <>
        {/* ── Left boot ── */}
        <path d="M16,102 L50,102 L52,114 L14,114 Z" fill={C.bo} />
        {/* Left-edge highlight strip */}
        <path d="M16,102 L25,102 L25,114 L14,114 Z" fill={C.boH} opacity="0.28" />
        {/* Toe-cap darker facet */}
        <path d="M14,109 L14,114 L52,114 L50,109 Z" fill={C.boS} />
        {/* Sole block */}
        <path d="M12,113 L54,113 L55,117 L11,117 Z" fill={C.boSl} />
        {/* Top-edge rim highlight so boot reads on dark bg */}
        <line x1="16" y1="102" x2="50" y2="102" stroke={C.boR} strokeWidth="1" opacity="0.8" />
        {/* Lace rows */}
        <line x1="19" y1="103.5" x2="47" y2="103.5" stroke="#4a4030" strokeWidth="0.7" opacity="0.6" />
        <line x1="19" y1="106.5" x2="47" y2="106.5" stroke="#4a4030" strokeWidth="0.7" opacity="0.6" />
        <line x1="18" y1="109.5" x2="48" y2="109.5" stroke="#4a4030" strokeWidth="0.6" opacity="0.45" />

        {/* ── Right boot ── */}
        <path d="M50,102 L84,102 L86,114 L48,114 Z" fill={C.bo} />
        <path d="M75,102 L84,102 L86,114 L76,114 Z" fill={C.boH} opacity="0.28" />
        <path d="M50,109 L48,114 L86,114 L84,109 Z" fill={C.boS} />
        <path d="M46,113 L88,113 L89,117 L45,117 Z" fill={C.boSl} />
        <line x1="50" y1="102" x2="84" y2="102" stroke={C.boR} strokeWidth="1" opacity="0.8" />
        <line x1="53" y1="103.5" x2="81" y2="103.5" stroke="#4a4030" strokeWidth="0.7" opacity="0.6" />
        <line x1="53" y1="106.5" x2="81" y2="106.5" stroke="#4a4030" strokeWidth="0.7" opacity="0.6" />
        <line x1="52" y1="109.5" x2="82" y2="109.5" stroke="#4a4030" strokeWidth="0.6" opacity="0.45" />
      </>}

      {footwear === 'shoes' && <>
        <path d="M18,104 L50,104 L52,114 L16,114 Z" fill="#3a2e24" />
        <path d="M14,112 L54,112 L54,116 L13,116 Z" fill="#1e1812" />
        <path d="M50,104 L82,104 L84,114 L48,114 Z" fill="#3a2e24" />
        <path d="M46,112 L86,112 L86,116 L45,116 Z" fill="#1e1812" />
      </>}

      {/* ══════════════════════════════════════
          2. LEGS — short chunky chibi
          ══════════════════════════════════════ */}
      {/* Left leg */}
      <path d={`M${ph.tL},88 L${ph.tL+20},88 L${ph.tL+18},103 L${ph.tL-2},103 Z`} fill={pc.f} />
      <path d={`M${ph.tL},88 L${ph.tL+8},88 L${ph.tL+6},103 L${ph.tL-2},103 Z`} fill={pc.l} opacity="0.3" />
      <path d={`M${ph.tL+16},88 L${ph.tL+20},88 L${ph.tL+18},103 L${ph.tL+14},103 Z`} fill={pc.s} opacity="0.5" />
      {/* Right leg */}
      <path d={`M${ph.tR-20},88 L${ph.tR},88 L${ph.tR+2},103 L${ph.tR-18},103 Z`} fill={pc.f} />
      <path d={`M${ph.tR-8},88 L${ph.tR},88 L${ph.tR+2},103 L${ph.tR-6},103 Z`} fill={pc.s} opacity="0.5" />
      <path d={`M${ph.tR-20},88 L${ph.tR-12},88 L${ph.tR-14},103 L${ph.tR-22},103 Z`} fill={pc.l} opacity="0.3" />
      {/* Crotch gusset */}
      <path d={`M${ph.tL+18},88 L${ph.tR-18},88 L${ph.tR-20},96 L${ph.tL+20},96 Z`} fill={pc.f} />
      <path d="M48,88 L52,88 L52,96 L48,96 Z" fill={pc.s} opacity="0.45" />

      {/* ══════════════════════════════════════
          3. ARMS — short, slightly angled
          ══════════════════════════════════════ */}
      {/* Left arm */}
      <path d={`M${ph.aL},62 L${ph.tL+2},59 L${ph.tL},82 L${ph.aL+2},80 Z`} fill={C.un} />
      <path d={`M${ph.aL},62 L${ph.aL+4},64 L${ph.aL+6},82 L${ph.aL+2},80 Z`} fill={C.unS} opacity="0.4" />
      {/* Right arm */}
      <path d={`M${ph.tR-2},59 L${ph.aR},62 L${ph.aR-2},80 L${ph.tR},82 Z`} fill={C.un} />
      <path d={`M${ph.aR-4},64 L${ph.aR},62 L${ph.aR-2},80 L${ph.aR-6},82 Z`} fill={C.unS} opacity="0.4" />

      {/* ══════════════════════════════════════
          4. TORSO — V-taper, low-poly facets
          ══════════════════════════════════════ */}
      <path d={`M${ph.tL},59 L${ph.tR},59 L${ph.tR-2},86 L${ph.tL+2},86 Z`} fill={C.un} />
      {/* Left highlight facet */}
      <path d={`M${ph.tL},59 L${ph.tL+14},59 L${ph.tL+12},86 L${ph.tL+2},86 Z`} fill={C.unL} opacity="0.28" />
      {/* Right shadow facet */}
      <path d={`M${ph.tR-14},59 L${ph.tR},59 L${ph.tR-2},86 L${ph.tR-16},86 Z`} fill={C.unS} opacity="0.42" />
      {/* V-collar notch */}
      <path d={`M${42},59 L50,67 L${58},59 Z`} fill={C.unS} opacity="0.65" />
      {/* Center seam hint */}
      <line x1="50" y1="68" x2="50" y2="84" stroke={C.unS} strokeWidth="0.5" opacity="0.3" />

      {/* ══════════════════════════════════════
          5. BELT + GOLD BUCKLE
          ══════════════════════════════════════ */}
      <path d={`M${ph.tL+2},84 L${ph.tR-2},84 L${ph.tR},89 L${ph.tL},89 Z`} fill={C.bt} />
      <path d={`M${ph.tR-12},84 L${ph.tR-2},84 L${ph.tR},89 L${ph.tR-14},89 Z`} fill={C.btS} opacity="0.5" />
      {/* Gold buckle — prominent rectangle, centered */}
      <rect x="43" y="84.5" width="14" height="5" rx="1" fill={C.bk} />
      <rect x="44.5" y="85.5" width="11" height="2.5" rx="0.5" fill={C.bkH} opacity="0.65" />
      <rect x="43" y="84.5" width="14" height="5" rx="1" fill="none" stroke={C.bkS} strokeWidth="0.5" />

      {/* ══════════════════════════════════════
          6. TACTICAL VEST (optional overlay)
          ══════════════════════════════════════ */}
      {sv && (() => {
        const vL = ph.tL + 6, vR = ph.tR - 6;
        return (
          <g>
            {/* Main panel */}
            <path d={`M${vL},61 L${vR},61 L${vR-2},86 L${vL+2},86 Z`} fill={C.vs} />
            {/* Right shadow */}
            <path d={`M50,61 L${vR},61 L${vR-2},86 L50,86 Z`} fill={C.vsS} opacity="0.4" />
            {/* Shoulder straps */}
            <path d={`M${vL},61 L${vL+10},59 L${vL+12},67 L${vL},69 Z`} fill={C.vs} />
            <path d={`M${vR},61 L${vR-10},59 L${vR-12},67 L${vR},69 Z`} fill={C.vs} />
            {/* Chest cummerbund strap */}
            <rect x={vL+10} y="66" width={vR-vL-20} height="2.5" rx="1" fill={C.btS} />
            {/* 3 Mag pouches */}
            {[vL+4, 44, vR-16].map((px, i) => (
              <g key={i}>
                <rect x={px} y="70" width="12" height="12" rx="1.5"
                  fill={C.vsPo} stroke={C.vsPoE} strokeWidth="0.6" />
                <rect x={px} y="79" width="12" height="3" rx="0.5" fill="#000" opacity="0.2" />
              </g>
            ))}
            {/* MOLLE dots */}
            {[vL+6, vL+9, vL+12].map((x,i) => <circle key={`ml${i}`} cx={x} cy="83" r="1" fill={C.vsPoE} />)}
            {[46, 49, 52].map((x,i)             => <circle key={`mc${i}`} cx={x} cy="83" r="1" fill={C.vsPoE} />)}
            {[vR-14,vR-11,vR-8].map((x,i)       => <circle key={`mr${i}`} cx={x} cy="83" r="1" fill={C.vsPoE} />)}
          </g>
        );
      })()}

      {/* ══════════════════════════════════════
          7. NECK
          ══════════════════════════════════════ */}
      <path d="M43,49 L57,49 L58,58 L42,58 Z" fill={C.sk} />
      <path d="M52,49 L57,49 L58,58 L54,58 Z" fill={C.skSh} opacity="0.38" />

      {/* ══════════════════════════════════════
          8. HEAD — large chibi block + facets
          ══════════════════════════════════════ */}
      {/* 8-point low-poly polygon — wide crown, tapered jaw */}
      <path d="M20,10 L50,5 L80,10 L82,28 L78,47 L50,49 L22,47 L18,28 Z" fill={C.sk} />
      {/* Right-side shadow wedge */}
      <path d="M66,10 L80,10 L82,28 L78,47 L62,47 Z" fill={C.skSh} opacity="0.32" />
      {/* Forehead highlight facet */}
      <path d="M38,8 L62,8 L60,19 L40,19 Z" fill="#fff" opacity="0.06" />
      {/* Chin shadow */}
      <path d="M36,43 L64,43 L62,49 L38,49 Z" fill={C.skDk} opacity="0.22" />
      {/* Left micro-highlight */}
      <path d="M18,28 L20,10 L28,12 L24,32 Z" fill="#fff" opacity="0.04" />

      {/* Ears */}
      <path d="M18,24 L14,27 L13,35 L17,37 L20,33 L20,24 Z" fill={C.sk} />
      <path d="M15,29 L13,32 L16,36 L17,37 L17,32 Z" fill={C.skSh} opacity="0.38" />
      <path d="M82,24 L86,27 L87,35 L83,37 L80,33 L80,24 Z" fill={C.sk} />
      <path d="M85,29 L87,32 L84,36 L83,37 L83,32 Z" fill={C.skSh} opacity="0.38" />

      {/* ══════════════════════════════════════
          9. HAIR
          ══════════════════════════════════════ */}
      {hg !== 'helmet' && hair !== 'shaved' && (
        hair === 'undercut' ? (
          <g>
            <path d="M16,28 L18,10 L50,5 L82,10 L84,22 L78,16 L65,11 L50,9 L35,11 L22,16 L20,22 Z"
              fill={C.hr} />
            <path d="M65,11 L82,10 L84,22 L78,16 Z" fill={C.hrS} opacity="0.7" />
            <path d="M35,11 L50,9 L62,11 L50,15 Z" fill={C.hrH} opacity="0.42" />
            <line x1="20" y1="22" x2="20" y2="32" stroke={C.hrS} strokeWidth="1.5" opacity="0.45" />
            <line x1="80" y1="22" x2="80" y2="32" stroke={C.hrS} strokeWidth="1.5" opacity="0.45" />
          </g>
        ) : (
          /* crew_cut — tight flat cap */
          <g>
            <path d="M18,28 L20,10 L50,5 L80,10 L82,20 L76,14 L65,11 L50,9 L35,11 L24,14 L20,20 Z"
              fill={C.hr} />
            <path d="M65,11 L80,10 L82,20 L76,14 Z" fill={C.hrS} opacity="0.65" />
            <path d="M35,11 L50,9 L60,11 L50,14 Z" fill={C.hrH} opacity="0.4" />
          </g>
        )
      )}
      {hair === 'shaved' && hg === 'none' && (
        <path d="M20,10 L50,5 L80,10 L82,22 L78,16 L50,13 L22,16 L18,22 Z"
          fill={C.hrS} opacity="0.4" />
      )}

      {/* ══════════════════════════════════════
          10. EYEBROWS — straight, neutral angle
          ══════════════════════════════════════ */}
      <path d="M27,19 L43,18 L44,21 L27,22 Z" fill={C.bw} />
      <path d="M57,18 L73,19 L73,22 L57,21 Z" fill={C.bw} />

      {/* Blush marks — chibi staple */}
      <ellipse cx="23" cy="37" rx="7.5" ry="4" fill={C.bl} opacity="0.14" />
      <ellipse cx="77" cy="37" rx="7.5" ry="4" fill={C.bl} opacity="0.14" />

      {/* ══════════════════════════════════════
          11. EYES (or shades)
          ══════════════════════════════════════ */}
      {ss ? (
        /* Tactical wrap-around shades */
        <g>
          <path d="M26,21 L46,20 L47,32 L26,33 Z" fill={C.shd} />
          <path d="M53,20 L74,21 L74,33 L53,32 Z" fill={C.shd} />
          <rect x="46" y="23" width="7" height="5" rx="0" fill="#0e1820" />
          <line x1="26" y1="21" x2="46" y2="20" stroke={C.shdR} strokeWidth="1" />
          <line x1="26" y1="21" x2="26" y2="33" stroke={C.shdR} strokeWidth="0.8" />
          <line x1="53" y1="20" x2="74" y2="21" stroke={C.shdR} strokeWidth="1" />
          <line x1="74" y1="21" x2="74" y2="33" stroke={C.shdR} strokeWidth="0.8" />
          <path d="M28,21 L36,20.5 L37,24 L29,24.5 Z" fill={C.shdG} opacity="0.17" />
          <path d="M55,20.5 L63,21 L64,24.5 L56,24 Z" fill={C.shdG} opacity="0.17" />
        </g>
      ) : (
        /* Chibi eyes — large whites, dark iris, heavy upper lid */
        <g>
          {/* ── Left eye ── */}
          {/* Sclera */}
          <path d="M27,21 L45,20 L46,34 L27,35 Z" fill={C.ew} />
          {/* Iris */}
          <ellipse cx="36" cy="27" rx="6.5" ry="7.5" fill={C.ir} />
          {/* Pupil */}
          <ellipse cx="36" cy="27.5" rx="4.5" ry="5" fill={C.pp} />
          {/* Shine spots */}
          <circle cx="40" cy="23.5" r="2.2" fill={C.es} opacity="0.9" />
          <circle cx="38.5" cy="30" r="1.1" fill={C.es} opacity="0.4" />
          {/* Heavy upper eyelid cap — skin colour sits ON TOP of iris */}
          <path d="M27,21 L45,20 L45,26 L27,27 Z" fill={C.sk} />
          {/* Eyelid crease line */}
          <path d="M27,27 L45,26" fill="none" stroke={C.el} strokeWidth="0.9" />
          {/* Lower lash line */}
          <path d="M27,35 L45,34" fill="none" stroke={C.el} strokeWidth="0.55" opacity="0.55" />

          {/* ── Right eye ── */}
          <path d="M55,20 L73,21 L74,35 L55,34 Z" fill={C.ew} />
          <ellipse cx="64" cy="27" rx="6.5" ry="7.5" fill={C.ir} />
          <ellipse cx="64" cy="27.5" rx="4.5" ry="5" fill={C.pp} />
          <circle cx="68" cy="23.5" r="2.2" fill={C.es} opacity="0.9" />
          <circle cx="66.5" cy="30" r="1.1" fill={C.es} opacity="0.4" />
          <path d="M55,20 L73,21 L73,26 L55,25 Z" fill={C.sk} />
          <path d="M55,25 L73,26" fill="none" stroke={C.el} strokeWidth="0.9" />
          <path d="M55,34 L73,35" fill="none" stroke={C.el} strokeWidth="0.55" opacity="0.55" />
        </g>
      )}

      {/* Nose — tiny shadow polygon */}
      <path d="M49,33 L51,33 L52.5,36.5 L50,37.5 L47.5,36.5 Z" fill={C.skSh} opacity="0.42" />

      {/* Mouth — neutral/slight frown via cubic bezier */}
      <path d="M43,42 C46,44.5 54,44.5 57,42"
        fill="none" stroke={C.skDk} strokeWidth="1.3" strokeLinecap="round" />

      {/* Stubble overlay */}
      {showStubble && (
        <path d="M34,39 L66,39 L64,49 L36,49 Z" fill="#3c1c08" opacity="0.16" />
      )}

      {/* ══════════════════════════════════════
          12. HEADGEAR
          ══════════════════════════════════════ */}
      {hg === 'beret' && (
        <g>
          {/* Crown — asymmetric, drapes right */}
          <path d="M22,20 C20,6 34,2 50,3 C66,2 80,6 78,18 C78,24 68,28 56,26 C52,28 40,26 32,22 Z"
            fill="#3d5c2a" />
          {/* Right drape fold */}
          <path d="M56,24 C66,26 74,30 78,36 C76,38 72,36 70,32 C67,28 62,26 56,24 Z"
            fill="#2a4018" />
          {/* Under-brim shadow */}
          <path d="M32,22 C40,26 52,28 56,26 C68,28 78,24 78,18 C76,22 68,24 56,22 C50,23 40,22 32,21 Z"
            fill="#000" opacity="0.12" />
          <line x1="32" y1="21" x2="40" y2="22" stroke="#2a4018" strokeWidth="1.5" />
          {/* Badge left */}
          <circle cx="36" cy="17" r="5.5" fill="#c8a040" />
          <circle cx="36" cy="17" r="3.5" fill="#e8c060" />
          <path d="M34.5,17 L36,14.5 L37.5,17 L36,19.5 Z" fill="#c8a040" />
          <circle cx="36" cy="17" r="1.1" fill="#e8c060" opacity="0.65" />
        </g>
      )}

      {hg === 'helmet' && (
        <g>
          <path d="M22,28 C20,10 34,2 50,2 C66,2 80,10 78,28 L78,34 C78,36 64,38 50,38 C36,38 22,36 22,34 Z"
            fill="#5c5e58" />
          <path d="M58,3 C66,6 80,12 78,28 L78,34 C78,36 64,38 58,38 L58,3 Z"
            fill="#3c3e38" opacity="0.5" />
          <path d="M20,31 L80,31 L78,35 C78,37 64,39 50,39 C36,39 22,37 22,35 Z"
            fill="#3c3e38" />
          <path d="M22,28 C20,10 34,2 50,2 C66,2 80,10 78,28"
            fill="none" stroke="#7a7c74" strokeWidth="1.2" opacity="0.8" />
          <rect x="20" y="29" width="5" height="3.5" rx="1" fill="#3c3e38" stroke="#5a5c58" strokeWidth="0.4" />
          <rect x="75" y="29" width="5" height="3.5" rx="1" fill="#3c3e38" stroke="#5a5c58" strokeWidth="0.4" />
        </g>
      )}

      {hg === 'boonie' && (
        <g>
          <path d="M34,19 C33,8 38,2 50,2 C62,2 67,8 66,19 L65,25 C65,27 58,29 50,29 C42,29 35,27 35,25 Z"
            fill="#3d5c2a" />
          <path d="M58,4 C64,8 66,12 66,19 L65,25 C65,27 58,29 58,25 L58,4 Z"
            fill="#2a4018" opacity="0.5" />
          {/* Wide floppy brim */}
          <path d="M8,23 C6,17 16,15 34,19 C40,23 60,23 66,19 C84,15 94,17 92,23 C90,29 80,30 66,27 C60,31 40,31 34,27 C16,31 8,29 8,23 Z"
            fill="#2a4018" />
          <path d="M18,23 C30,19 42,20 50,20 C58,20 70,19 82,23"
            fill="none" stroke="#3d5c2a" strokeWidth="1" opacity="0.7" />
          <rect x="34" y="22" width="32" height="3" rx="0" fill="#2a4018" opacity="0.5" />
        </g>
      )}

      {/* ══════════════════════════════════════
          13. UI OVERLAY — level bar
          ══════════════════════════════════════ */}
      {showUI && (
        <g>
          {/* Bar background track */}
          <rect x={BAR_X} y="120" width={BAR_W} height="4.5" rx="2.25"
            fill="rgba(255,255,255,0.07)" />
          {/* Bar fill */}
          {barFill > 0 && (
            <rect x={BAR_X} y="120" width={barFill} height="4.5" rx="2.25"
              fill={C.uiG} />
          )}
          {/* Bar tip shimmer */}
          {barFill > 3 && (
            <rect x={BAR_X + barFill - 2} y="120.5" width="2" height="3.5" rx="1"
              fill="#e8d070" opacity="0.55" />
          )}
          {/* Lv N  — left of bar */}
          <text x="10" y="125.5"
            fontSize="5.2" fontFamily="'Courier New',monospace"
            fontWeight="bold" fill={C.uiG}>
            Lv {level}
          </text>
          {/* N XP  — right of bar */}
          <text x="90" y="125.5"
            fontSize="5.2" fontFamily="'Courier New',monospace"
            fontWeight="bold" fill={C.uiG} textAnchor="end">
            {xp} XP
          </text>
          {/* tap to customise */}
          <text x="50" y="133.5"
            fontSize="3.6" fontFamily="sans-serif"
            fill={C.uiT} textAnchor="middle">
            tap to customise
          </text>
        </g>
      )}

    </svg>
  );
}
