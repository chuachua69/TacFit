/**
 * PixelCharacter.jsx  —  Vector-minimalist cel-shaded tactical character
 * ViewBox: 0 0 100 130  |  All layers drawn bottom → top
 *
 * Props:
 *   headgear   'beret'|'helmet'|'boonie'|'none'
 *   hair       'crew_cut'|'undercut'|'shaved'
 *   showShades boolean
 *   showStubble boolean
 *   physique   'lean'|'athletic'|'jacked'
 *   showVest   boolean
 *   pantsColor 'olive'|'tan'|'gray'
 *   footwear   'boots'|'shoes'|'none'
 *   size       number  (width = 100*size, height = 130*size)
 */

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  // Skin
  sk:   '#c8906a', skSh: '#9a6848', skDk: '#6e4428',
  // Eyes / face
  eye:  '#1a1008', eyeW: '#d4cbb8', eyeS: '#ffffff',
  brow: '#3a1a08', mouth:'#8a4a2e',
  stub: '#3c1c08',   // stubble tint
  // Hair (dark brown)
  hair: '#2a1a0c', hairM:'#3c2618',
  // Uniform — olive
  oli:  '#4a6035', oliS: '#344825',
  // Tan / gray variants
  tan:  '#8a7a5a', tanS: '#6a5a3a',
  gry:  '#585868', gryS: '#3e3e4e',
  // Tactical vest (coyote brown — NOT black so it reads on dark bg)
  ves:  '#3e3420', vesS: '#2a2418',
  pou:  '#302c18', pouE: '#4e4428',
  // Belt / buckle
  blt:  '#4a3018', bck:  '#c8a040', bckH:'#e8d060',
  // Boots — dark olive-brown with rim highlight
  bot:  '#2a2210', botS: '#1c1a0e', botR: '#4a4030',
  // Beret
  bgr:  '#3d5c2a', bgrS: '#2a4018',
  bdg:  '#c8a040', bdgH:'#e8d060',
  // Helmet
  hlm:  '#5c5e58', hlmS: '#3c3e38', hlmE: '#7a7c74',
  // Shades (tactical glasses — dark teal, NOT black, with rim)
  shd:  '#162028', shdR: '#4a6878', shdG: '#7aafc8',
};

// ─── PHYSIQUE BODY CONFIGS ───────────────────────────────────────────────────
// sL/sR = shoulder left/right x
// wL/wR = waist left/right x
// Each arm is a slanted quad: outer shoulder angles out from torso
const PHYS = {
  lean: {
    sL:22, sR:78, wL:32, wR:68,
    // torso trapezoid
    tor:   'M22,46 L78,46 L68,90 L32,90 Z',
    torSh: 'M55,46 L78,46 L68,90 L59,90 Z',
    // arms [outer-top, inner-top, inner-bot, outer-bot]
    aLt:[10,22], aLb:[26,14],
    aRt:[90,78], aRb:[74,86],
  },
  athletic: {
    sL:16, sR:84, wL:28, wR:72,
    tor:   'M16,46 L84,46 L72,90 L28,90 Z',
    torSh: 'M58,46 L84,46 L72,90 L62,90 Z',
    aLt:[4,18],  aLb:[22,10],
    aRt:[96,82], aRb:[78,90],
  },
  jacked: {
    sL:10, sR:90, wL:24, wR:76,
    tor:   'M10,46 L90,46 L76,90 L24,90 Z',
    torSh: 'M62,46 L90,46 L76,90 L64,90 Z',
    aLt:[2,12],  aLb:[18,6],
    aRt:[98,88], aRb:[82,94],
  },
};

// pants colour lookup
const PANTS = {
  olive: { fill: C.oli,  sh: C.oliS },
  tan:   { fill: C.tan,  sh: C.tanS },
  gray:  { fill: C.gry,  sh: C.gryS },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function PixelCharacter({
  // new API
  headgear:   _hg,
  hair        = 'crew_cut',
  showShades: _ss,
  showStubble = false,
  physique    = 'athletic',
  showVest:   _sv,
  pantsColor  = 'olive',
  footwear    = 'boots',
  // legacy compat
  equipped    = {},
  size        = 1,
  onClick,
}) {
  // map legacy equipped → new props when new props are absent
  const HEAD_MAP = {
    beret_green:'beret', helmet_mk6:'helmet',
    boonie_hat:'boonie', ops_helmet:'helmet',
  };
  const headgear  = _hg  ?? HEAD_MAP[equipped.head]  ?? 'none';
  const showShades= _ss  ?? (equipped.face==='visor_amber'||equipped.face==='nvg') ?? false;
  const showVest  = _sv  ?? (equipped.body != null && equipped.body !== undefined) ?? true;

  const ph  = PHYS[physique] || PHYS.athletic;
  const pc  = PANTS[pantsColor] || PANTS.olive;
  const uni = C.oli;   // shirt is always olive under vest
  const uSh = C.oliS;

  // arm path helper
  const armPath = (ot, it, ib, ob) =>
    `M${ot},52 L${it},46 L${ib},96 L${ob},96 Z`;

  // vest coords derived from physique
  const vL = ph.sL + 6, vR = ph.sR - 6;

  return (
    <svg
      width={100 * size} height={130 * size}
      viewBox="0 0 100 130"
      style={{ imageRendering:'auto', cursor: onClick ? 'pointer':'default', overflow:'visible' }}
      onClick={onClick}
    >

      {/* ══════════════════════════════════════════
          1. FOOTWEAR
          ══════════════════════════════════════════ */}
      {footwear === 'boots' && <>
        {/* ── Left boot ── */}
        {/* Upper — angular, toe kicks forward/left */}
        <path d="M14,114 L38,114 L38,126 L12,126 L12,118 Z"
          fill={C.bot} />
        {/* Toe cap — darker facet */}
        <path d="M12,118 L12,126 L38,126 L38,122 L20,122 Z"
          fill="#1a1608" />
        {/* Sole block */}
        <rect x="10" y="124" width="30" height="5" rx="1" fill={C.botS} />
        {/* Rim highlight — 1px line so boot reads against black bg */}
        <polyline points="14,114 38,114 38,118" fill="none" stroke={C.botR} strokeWidth="1.2" strokeLinejoin="round" />
        <line x1="14" y1="114" x2="12" y2="118" stroke={C.botR} strokeWidth="1.2" />
        {/* Lace rows */}
        <line x1="18" y1="115" x2="34" y2="115" stroke={C.pouE} strokeWidth="0.6" opacity="0.7" />
        <line x1="17" y1="118" x2="35" y2="118" stroke={C.pouE} strokeWidth="0.6" opacity="0.7" />
        <line x1="16" y1="121" x2="36" y2="121" stroke={C.pouE} strokeWidth="0.6" opacity="0.7" />

        {/* ── Right boot ── */}
        <path d="M62,114 L86,114 L88,118 L88,126 L62,126 Z"
          fill={C.bot} />
        <path d="M62,122 L62,126 L88,126 L88,122 L80,122 Z"
          fill="#1a1608" />
        <rect x="60" y="124" width="30" height="5" rx="1" fill={C.botS} />
        <polyline points="62,114 86,114 88,118" fill="none" stroke={C.botR} strokeWidth="1.2" strokeLinejoin="round" />
        <line x1="62" y1="114" x2="62" y2="118" stroke={C.botR} strokeWidth="1.2" />
        <line x1="66" y1="115" x2="82" y2="115" stroke={C.pouE} strokeWidth="0.6" opacity="0.7" />
        <line x1="65" y1="118" x2="83" y2="118" stroke={C.pouE} strokeWidth="0.6" opacity="0.7" />
        <line x1="64" y1="121" x2="84" y2="121" stroke={C.pouE} strokeWidth="0.6" opacity="0.7" />
      </>}

      {footwear === 'shoes' && <>
        <path d="M16,116 L38,116 L40,126 L12,126 Z" fill="#342e28" />
        <rect x="10" y="124" width="32" height="4" rx="1" fill="#201c18" />
        <line x1="16" y1="116" x2="38" y2="116" stroke="#5a5048" strokeWidth="1" />
        <path d="M62,116 L84,116 L88,126 L60,126 Z" fill="#342e28" />
        <rect x="58" y="124" width="32" height="4" rx="1" fill="#201c18" />
        <line x1="62" y1="116" x2="84" y2="116" stroke="#5a5048" strokeWidth="1" />
      </>}

      {/* ══════════════════════════════════════════
          2. LEGS — A-stance, feet spread
          ══════════════════════════════════════════ */}
      {/* Left leg — tapers outward going down */}
      <path d={`M${ph.wL},98 L${ph.wL+12},98 L${ph.wL+8},${footwear==='boots'?114:116} L${ph.wL-8},${footwear==='boots'?114:116} Z`}
        fill={pc.fill} />
      {/* Shadow strip (inner right edge) */}
      <path d={`M${ph.wL+8},98 L${ph.wL+12},98 L${ph.wL+8},${footwear==='boots'?114:116} L${ph.wL+5},${footwear==='boots'?114:116} Z`}
        fill={pc.sh} opacity="0.7" />

      {/* Right leg */}
      <path d={`M${ph.wR-12},98 L${ph.wR},98 L${ph.wR+8},${footwear==='boots'?114:116} L${ph.wR-8},${footwear==='boots'?114:116} Z`}
        fill={pc.fill} />
      <path d={`M${ph.wR-12},98 L${ph.wR-8},98 L${ph.wR-8},${footwear==='boots'?114:116} L${ph.wR-11},${footwear==='boots'?114:116} Z`}
        fill={pc.sh} opacity="0.7" />

      {/* Crotch gusset — connects legs, creates the stance gap */}
      <path d={`M${ph.wL},98 L${ph.wR},98 L${ph.wR-4},106 L${ph.wL+4},106 Z`}
        fill={pc.fill} />
      <path d={`M${ph.wL+(ph.wR-ph.wL)*0.55},98 L${ph.wR},98 L${ph.wR-4},106 L${ph.wL+(ph.wR-ph.wL)*0.6},106 Z`}
        fill={pc.sh} opacity="0.5" />

      {/* ══════════════════════════════════════════
          3. ARMS
          ══════════════════════════════════════════ */}
      {/* Left arm — slanted quad, outer shoulder angles away */}
      <path d={armPath(ph.aLt[0], ph.aLt[1], ph.aLb[0], ph.aLb[1])}
        fill={uni} />
      {/* Arm outer-edge shadow */}
      <path d={`M${ph.aLt[0]},52 L${ph.aLt[0]+4},56 L${ph.aLb[1]+4},96 L${ph.aLb[1]},96 Z`}
        fill={uSh} opacity="0.5" />

      {/* Right arm */}
      <path d={armPath(ph.aRt[1], ph.aRt[0], ph.aRb[0], ph.aRb[1])}
        fill={uni} />
      <path d={`M${ph.aRt[0]},52 L${ph.aRt[0]-4},56 L${ph.aRb[1]-4},96 L${ph.aRb[1]},96 Z`}
        fill={uSh} opacity="0.5" />

      {/* ══════════════════════════════════════════
          4. BASE TORSO — V-taper trapezoid
          ══════════════════════════════════════════ */}
      <path d={ph.tor} fill={uni} />
      {/* Right-side cel-shadow wedge */}
      <path d={ph.torSh} fill={uSh} opacity="0.45" />

      {/* ══════════════════════════════════════════
          5. BELT
          ══════════════════════════════════════════ */}
      <rect x={ph.wL} y="87" width={ph.wR - ph.wL} height="6" rx="1" fill={C.blt} />
      {/* Buckle — centered */}
      <rect x="45" y="87.5" width="10" height="5" rx="1" fill={C.bck} />
      <rect x="46.5" y="88.5" width="7" height="3" rx="0.5" fill={C.bckH} />

      {/* ══════════════════════════════════════════
          6. TACTICAL VEST (conditional)
          ══════════════════════════════════════════ */}
      {showVest && <>
        {/* Main plate carrier panel */}
        <path d={`M${vL},48 L${vR},48 L${vR-2},87 L${vL+2},87 Z`}
          fill={C.ves} />
        {/* Right cel-shadow */}
        <path d={`M${vL+(vR-vL)*0.5},48 L${vR},48 L${vR-2},87 L${vL+(vR-vL)*0.52},87 Z`}
          fill={C.vesS} opacity="0.5" />

        {/* Shoulder strap — left */}
        <path d={`M${vL},50 L${vL+10},46 L${vL+12},54 L${vL},58 Z`}
          fill={C.ves} />
        {/* Shoulder strap — right */}
        <path d={`M${vR},50 L${vR-10},46 L${vR-12},54 L${vR},58 Z`}
          fill={C.ves} />

        {/* Cummerbund chest strap */}
        <rect x={vL+12} y="61" width={vR-vL-24} height="3" rx="1" fill={C.blt} />

        {/* ── Mag pouches × 3 ── */}
        {/* Left pouch */}
        <rect x={vL+4} y="65" width="12" height="16" rx="1.5"
          fill={C.pou} stroke={C.pouE} strokeWidth="0.8" />
        <rect x={vL+4} y="77" width="12" height="4" rx="0.5"
          fill="#000" opacity="0.25" />
        {/* Centre pouch */}
        <rect x="44" y="65" width="12" height="16" rx="1.5"
          fill={C.pou} stroke={C.pouE} strokeWidth="0.8" />
        <rect x="44" y="77" width="12" height="4" rx="0.5"
          fill="#000" opacity="0.25" />
        {/* Right pouch */}
        <rect x={vR-16} y="65" width="12" height="16" rx="1.5"
          fill={C.pou} stroke={C.pouE} strokeWidth="0.8" />
        <rect x={vR-16} y="77" width="12" height="4" rx="0.5"
          fill="#000" opacity="0.25" />

        {/* MOLLE dot-row on each pouch */}
        {[vL+6, vL+9, vL+12].map((x,i)=>(
          <circle key={`pl${i}`} cx={x} cy="82" r="1" fill={C.pouE} />
        ))}
        {[46,49,52].map((x,i)=>(
          <circle key={`pc${i}`} cx={x} cy="82" r="1" fill={C.pouE} />
        ))}
        {[vR-14,vR-11,vR-8].map((x,i)=>(
          <circle key={`pr${i}`} cx={x} cy="82" r="1" fill={C.pouE} />
        ))}
      </>}

      {/* ══════════════════════════════════════════
          7. NECK
          ══════════════════════════════════════════ */}
      <rect x="43" y="36" width="14" height="11" rx="2" fill={C.sk} />
      {/* Right-side neck shadow */}
      <rect x="50" y="36" width="7" height="11" rx="1" fill={C.skSh} opacity="0.4" />
      {/* Collar line hint */}
      <path d={`M${vL},50 L43,44 L43,38 L57,38 L57,44 L${vR},50`}
        fill="none" stroke={uSh} strokeWidth="0.9" opacity={showVest ? 0 : 0.5} />

      {/* ══════════════════════════════════════════
          8. HEAD — angular chiseled jawline
          ══════════════════════════════════════════ */}
      {/* Main head: temples wider, jaw tapers in sharply */}
      <path d="M37,8 L63,8 L67,12 L69,24 L64,36 L36,36 L31,24 L33,12 Z"
        fill={C.sk} />
      {/* Right-side cel-shadow: covers ~35% of face */}
      <path d="M58,8 L63,8 L67,12 L69,24 L64,36 L58,36 Z"
        fill={C.skSh} opacity="0.45" />
      {/* Chin/jaw shadow — adds depth under the jawline */}
      <path d="M36,30 L64,30 L64,36 L36,36 Z"
        fill={C.skDk} opacity="0.3" />
      {/* Ears — small angular quads */}
      <path d="M31,20 L27,22 L27,29 L32,27 Z" fill={C.sk} />
      <path d="M69,20 L73,22 L73,29 L68,27 Z" fill={C.sk} />
      {/* Ear shadow inner */}
      <path d="M29,23 L27,25 L28,28 L31,26 Z" fill={C.skSh} opacity="0.5" />
      <path d="M71,23 L73,25 L72,28 L69,26 Z" fill={C.skSh} opacity="0.5" />

      {/* ══════════════════════════════════════════
          9. FACE DETAILS
          ══════════════════════════════════════════ */}
      {/* Brow ridges — slanted angular shapes */}
      <path d="M38,17 L48,15.5 L49,18 L38,19 Z" fill={C.brow} opacity="0.75" />
      <path d="M51,15.5 L61,17 L62,19 L51,18 Z" fill={C.brow} opacity="0.75" />

      {/* ── EYES or SHADES ── */}
      {showShades ? (
        /* Tactical angular glasses — wrap-around style */
        <g>
          {/* Left lens — slightly trapezoidal */}
          <path d="M36,19 L49,18 L50,25 L36,26 Z" fill={C.shd} />
          {/* Right lens */}
          <path d="M51,18 L64,19 L64,26 L51,25 Z" fill={C.shd} />
          {/* Bridge */}
          <rect x="49" y="20.5" width="2" height="2.5" rx="0.5" fill="#0e1820" />
          {/* Rim highlights — crucial for reading against dark face */}
          <line x1="36" y1="19" x2="49" y2="18" stroke={C.shdR} strokeWidth="0.9" />
          <line x1="36" y1="19" x2="36" y2="26" stroke={C.shdR} strokeWidth="0.7" />
          <line x1="51" y1="18" x2="64" y2="19" stroke={C.shdR} strokeWidth="0.9" />
          <line x1="64" y1="19" x2="64" y2="26" stroke={C.shdR} strokeWidth="0.7" />
          <line x1="36" y1="26" x2="50" y2="25" stroke={C.shdR} strokeWidth="0.5" opacity="0.5" />
          <line x1="51" y1="25" x2="64" y2="26" stroke={C.shdR} strokeWidth="0.5" opacity="0.5" />
          {/* Glare streaks */}
          <path d="M38,19.5 L44,19 L45,21 L39,21.5 Z" fill={C.shdG} opacity="0.2" />
          <path d="M53,18.5 L59,19 L60,21 L54,20.5 Z" fill={C.shdG} opacity="0.2" />
        </g>
      ) : (
        /* Default eyes — narrow tactical squint */
        <g>
          {/* Left eye socket + iris */}
          <path d="M39,19 L48,18.5 L49,23 L39,23.5 Z" fill={C.eyeW} />
          <ellipse cx="44" cy="21" rx="3" ry="2.2" fill={C.eye} />
          <circle cx="45" cy="20" r="0.9" fill={C.eyeS} opacity="0.6" />
          {/* Right eye */}
          <path d="M51,18.5 L60,19 L61,23.5 L51,23 Z" fill={C.eyeW} />
          <ellipse cx="56" cy="21" rx="3" ry="2.2" fill={C.eye} />
          <circle cx="57" cy="20" r="0.9" fill={C.eyeS} opacity="0.6" />
        </g>
      )}

      {/* Nose — angular V hint */}
      <path d="M49,24 L47,29 L50,31 L53,29 L51,24"
        fill="none" stroke={C.skSh} strokeWidth="1" strokeLinejoin="round" opacity="0.55" />

      {/* Mouth — thin determined line, slight downset */}
      <path d="M42,33 L47,31.5 L53,31.5 L58,33"
        fill="none" stroke={C.mouth} strokeWidth="1.3" strokeLinecap="round" />

      {/* Stubble mask — semi-transparent dark tint on lower jaw */}
      {showStubble && (
        <path d="M35,27 L65,27 L64,36 L36,36 Z"
          fill={C.stub} opacity="0.2" />
      )}

      {/* ══════════════════════════════════════════
          10. HAIR (shown when not fully covered)
          ══════════════════════════════════════════ */}
      {headgear !== 'helmet' && hair !== 'shaved' && (
        hair === 'undercut' ? (
          /* Undercut — fuller volume on top, hard side-fade line */
          <g>
            <path d="M34,4 L66,4 L68,11 L32,11 Z" fill={C.hair} />
            {/* Side fade hard line */}
            <path d="M32,11 L34,4 L37,8 L33,12 Z" fill={C.hairM} />
            <path d="M68,11 L66,4 L63,8 L67,12 Z" fill={C.hairM} />
          </g>
        ) : (
          /* Crew-cut — tight flat top */
          <path d="M37,8 L63,8 L66,11 L34,11 Z" fill={C.hair} />
        )
      )}
      {hair === 'shaved' && headgear === 'none' && (
        /* Shaved — thin scalp tint */
        <path d="M37,8 L63,8 L67,12 L69,20 L67,18 L33,18 L31,20 L33,12 Z"
          fill={C.hairM} opacity="0.45" />
      )}

      {/* ══════════════════════════════════════════
          11. HEADGEAR (topmost layer)
          ══════════════════════════════════════════ */}
      {headgear === 'beret' && (
        <g>
          {/* Crown — asymmetric blob pulled right, drapes over right ear */}
          <path d="M28,16 C26,6 34,2 50,3 C66,2 74,6 74,14 C74,19 65,22 56,20 C52,22 42,21 34,17 Z"
            fill={C.bgr} />
          {/* Right drape fold */}
          <path d="M58,19 C64,20 70,23 74,28 C72,30 68,28 66,25 C63,23 60,21 58,19 Z"
            fill={C.bgrS} />
          {/* Under-brim shadow line */}
          <path d="M34,17 C42,21 52,22 56,20 C65,22 74,19 74,14 C72,18 64,19 56,18 C50,19 40,18 34,16 Z"
            fill="#000" opacity="0.15" />
          {/* Band line at hairline */}
          <line x1="34" y1="16" x2="40" y2="17" stroke={C.bgrS} strokeWidth="1.5" />
          {/* Badge — pinned on left side */}
          <circle cx="38" cy="14" r="4.5" fill={C.bdg} />
          <circle cx="38" cy="14" r="2.8" fill={C.bdgH} />
          {/* Badge symbol — diamond */}
          <path d="M36.5,14 L38,11.5 L39.5,14 L38,16.5 Z" fill={C.bdg} />
          <circle cx="38" cy="14" r="0.9" fill={C.bdgH} opacity="0.6" />
        </g>
      )}

      {headgear === 'helmet' && (
        <g>
          {/* Dome shell */}
          <path d="M28,20 C26,8 34,2 50,2 C66,2 74,8 72,20 L72,26 C72,28 66,30 50,30 C34,30 28,28 28,26 Z"
            fill={C.hlm} />
          {/* Right-side dome shadow */}
          <path d="M58,3 C66,6 72,12 72,20 L72,26 C72,28 66,30 58,30 L58,3 Z"
            fill={C.hlmS} opacity="0.5" />
          {/* Brim lip — darker rim below dome */}
          <path d="M26,25 L74,25 L72,29 C72,31 66,32 50,32 C34,32 28,31 28,29 Z"
            fill={C.hlmS} />
          {/* Rim highlight (top edge pops against dark bg) */}
          <path d="M28,20 C26,8 34,2 50,2 C66,2 74,8 72,20"
            fill="none" stroke={C.hlmE} strokeWidth="1.2" opacity="0.8" />
          {/* Side rail stubs */}
          <rect x="26" y="22" width="5" height="3" rx="0.8" fill={C.hlmS} stroke={C.hlmE} strokeWidth="0.4" />
          <rect x="69" y="22" width="5" height="3" rx="0.8" fill={C.hlmS} stroke={C.hlmE} strokeWidth="0.4" />
        </g>
      )}

      {headgear === 'boonie' && (
        <g>
          {/* Crown */}
          <path d="M34,15 C33,6 38,2 50,2 C62,2 67,6 66,15 L65,21 C65,23 58,25 50,25 C42,25 35,23 35,21 Z"
            fill={C.bgr} />
          {/* Crown right shadow */}
          <path d="M58,3 C64,7 66,11 66,15 L65,21 C65,23 58,25 58,21 L58,3 Z"
            fill={C.bgrS} opacity="0.5" />
          {/* Wide floppy brim — droops at sides */}
          <path d="M10,21 C8,16 16,14 34,16 C40,20 60,20 66,16 C84,14 92,16 90,21 C88,26 80,27 66,24 C60,28 40,28 34,24 C16,28 10,26 10,21 Z"
            fill={C.bgrS} />
          {/* Brim top-edge highlight */}
          <path d="M18,20 C30,16 42,17 50,17 C58,17 70,16 82,20"
            fill="none" stroke={C.bgr} strokeWidth="1" opacity="0.7" />
          {/* Sweat-band strip */}
          <rect x="34" y="19" width="32" height="3" rx="0" fill={C.bgrS} opacity="0.6" />
        </g>
      )}
    </svg>
  );
}
