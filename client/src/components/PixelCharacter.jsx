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

      {/* Bobbing group — gentle idle motion (UI overlay stays static below) */}
      <g className="tac-bob" style={{ animationDelay: `${(physique?.length || 0) * 0.13}s` }}>

      {/* ══════════════════════════════════════
          1. BOOTS  (drawn first, back layer)
          ══════════════════════════════════════ */}
      {footwear === 'boots' && <>
        {/* ── Left boot ── compact, sits under left leg, clear center gap */}
        <path d="M20,104 L46,104 L47,113 L19,113 Z" fill={C.bo} />
        <path d="M20,104 L27,104 L27,113 L19,113 Z" fill={C.boH} opacity="0.28" />
        <path d="M19,110 L19,113 L47,113 L46,110 Z" fill={C.boS} />
        <path d="M17,112 L49,112 L50,116 L16,116 Z" fill={C.boSl} />
        <line x1="20" y1="104" x2="46" y2="104" stroke={C.boR} strokeWidth="0.9" opacity="0.8" />
        <line x1="23" y1="105.5" x2="43" y2="105.5" stroke="#4a4030" strokeWidth="0.6" opacity="0.6" />
        <line x1="22" y1="108"   x2="44" y2="108"   stroke="#4a4030" strokeWidth="0.6" opacity="0.55" />
        <line x1="21" y1="110.5" x2="45" y2="110.5" stroke="#4a4030" strokeWidth="0.5" opacity="0.4" />

        {/* ── Right boot ── */}
        <path d="M54,104 L80,104 L81,113 L53,113 Z" fill={C.bo} />
        <path d="M73,104 L80,104 L81,113 L74,113 Z" fill={C.boH} opacity="0.28" />
        <path d="M53,110 L53,113 L81,113 L80,110 Z" fill={C.boS} />
        <path d="M51,112 L83,112 L84,116 L50,116 Z" fill={C.boSl} />
        <line x1="54" y1="104" x2="80" y2="104" stroke={C.boR} strokeWidth="0.9" opacity="0.8" />
        <line x1="57" y1="105.5" x2="77" y2="105.5" stroke="#4a4030" strokeWidth="0.6" opacity="0.6" />
        <line x1="56" y1="108"   x2="78" y2="108"   stroke="#4a4030" strokeWidth="0.6" opacity="0.55" />
        <line x1="55" y1="110.5" x2="79" y2="110.5" stroke="#4a4030" strokeWidth="0.5" opacity="0.4" />
      </>}

      {footwear === 'shoes' && <>
        <path d="M20,105 L46,105 L47,113 L19,113 Z" fill="#3a2e24" />
        <path d="M17,112 L49,112 L50,116 L16,116 Z" fill="#1e1812" />
        <path d="M54,105 L80,105 L81,113 L53,113 Z" fill="#3a2e24" />
        <path d="M51,112 L83,112 L84,116 L50,116 Z" fill="#1e1812" />
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
          3. ARMS — chunky sleeves + skin mitten hands
          ══════════════════════════════════════ */}
      {/* ── Left arm ── */}
      {/* Sleeve */}
      <path d={`M${ph.aL},61 L${ph.tL+1},60 L${ph.tL},75 L${ph.aL-1},76 Z`} fill={C.un} />
      {/* Sleeve shadow facet (inner) */}
      <path d={`M${ph.tL-4},60 L${ph.tL+1},60 L${ph.tL},75 L${ph.tL-5},75 Z`} fill={C.unS} opacity="0.42" />
      {/* Sleeve cuff line */}
      <line x1={ph.aL-1} y1="74" x2={ph.tL} y2="74" stroke={C.unS} strokeWidth="0.8" opacity="0.6" />
      {/* Hand — mitten */}
      <ellipse cx={ph.aL+2} cy="79" rx="5" ry="5.5" fill={C.sk} />
      {/* Hand shadow facet */}
      <path d={`M${ph.aL+2},74 A5,5.5 0 0 1 ${ph.aL+7},79 A5,5.5 0 0 1 ${ph.aL+2},84.5 Z`} fill={C.skSh} opacity="0.3" />
      {/* Thumb bump */}
      <circle cx={ph.aL+6} cy="77" r="1.8" fill={C.sk} />

      {/* ── Right arm ── */}
      <path d={`M${ph.tR-1},60 L${ph.aR},61 L${ph.aR+1},76 L${ph.tR},75 Z`} fill={C.un} />
      <path d={`M${ph.tR-1},60 L${ph.tR+4},60 L${ph.tR+5},75 L${ph.tR},75 Z`} fill={C.unS} opacity="0.42" />
      <line x1={ph.tR} y1="74" x2={ph.aR+1} y2="74" stroke={C.unS} strokeWidth="0.8" opacity="0.6" />
      <ellipse cx={ph.aR-2} cy="79" rx="5" ry="5.5" fill={C.sk} />
      <path d={`M${ph.aR-2},74 A5,5.5 0 0 0 ${ph.aR-7},79 A5,5.5 0 0 0 ${ph.aR-2},84.5 Z`} fill={C.skSh} opacity="0.3" />
      <circle cx={ph.aR-6} cy="77" r="1.8" fill={C.sk} />

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
          {/* Crown — larger, sits over the whole skull, drapes right */}
          <path d="M13,23 C11,3 34,-1 51,0 C70,-1 88,4 86,19 C86,28 70,33 54,31 C47,33 33,30 24,25 Z"
            fill="#3d5c2a" />
          {/* Crown top highlight */}
          <path d="M30,6 C40,2 56,2 66,5 C58,8 42,8 32,9 Z" fill="#4a6f33" opacity="0.5" />
          {/* Right drape fold (overhangs ear) */}
          <path d="M54,28 C68,30 79,34 85,42 C81,44 75,40 71,35 C66,30 60,29 54,28 Z"
            fill="#2a4018" />
          {/* Under-brim shadow line */}
          <path d="M24,25 C33,30 47,33 54,31 C70,33 86,28 86,19 C83,24 70,26 54,24 C46,25 33,24 24,23 Z"
            fill="#000" opacity="0.13" />
          {/* Headband */}
          <line x1="24" y1="24" x2="36" y2="27" stroke="#2a4018" strokeWidth="2" />
          {/* Badge — bigger, left */}
          <circle cx="33" cy="16" r="7" fill="#c8a040" />
          <circle cx="33" cy="16" r="4.5" fill="#e8c060" />
          <path d="M31,16 L33,12.5 L35,16 L33,19.5 Z" fill="#c8a040" />
          <circle cx="33" cy="16" r="1.4" fill="#fff" opacity="0.6" />
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

      </g>{/* end bobbing group */}

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
