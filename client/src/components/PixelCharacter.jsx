import { ITEMS } from '../store/character';

// Colour palette
const C = {
  ol:  '#0d0d12',   // outline
  sk:  '#c8906a',   // skin
  skd: '#a07050',   // skin shadow
  sub: '#7a4828',   // stubble
  eye: '#111111',   // eye
  shi: '#ffffff',   // eye shine
  uni: '#4a6035',   // uniform olive
  und: '#344825',   // uniform shadow
  ves: '#3d3428',   // vest coyote
  vsd: '#2a231a',   // vest shadow
  pou: '#4a4038',   // pouch
  psd: '#302820',   // pouch shadow
  blt: '#5a4020',   // belt leather
  bck: '#c8a040',   // buckle gold
  pnt: '#2a3822',   // pants
  pnd: '#1a2818',   // pants shadow
  bot: '#1a1008',   // boot
  bsd: '#0e0804',   // boot sole
  bgr: '#3d5c2a',   // beret green
  bgs: '#2a4018',   // beret shadow
  bdg: '#c8a040',   // badge gold
};

// ── HEAD GEAR LAYERS ──────────────────────────────────────────────

function BeretGreen() {
  return (
    <g>
      {/* Beret crown — angled, pulled left */}
      <path d="M14,10 C13,4 19,1 30,2 C41,1 47,5 46,10 C45,13 40,15 33,14 C31,15 26,15 20,13 Z"
        fill={C.bgr} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      {/* Left drape — fabric folds down toward the ear */}
      <path d="M19,12 C15,14 12,17 13,22 C15,22 18,18 20,15 Z"
        fill={C.bgs} stroke={C.ol} strokeWidth="0.7" strokeLinejoin="round" />
      {/* Under-brim shadow */}
      <path d="M20,13 C26,15 31,15 33,14 C40,15 45,13 46,10 C42,13 34,15 30,15 C26,15 20,14 19,12 Z"
        fill="#000" opacity="0.18" />
      {/* Badge */}
      <circle cx="22" cy="10" r="3.2" fill={C.bdg} stroke={C.ol} strokeWidth="0.6" />
      <circle cx="22" cy="10" r="1.9" fill="#e8c870" />
      <path d="M21,10 L22,7.8 L23,10 L22,12.2 Z" fill={C.bdg} />
    </g>
  );
}

function HelmetMk6() {
  return (
    <g>
      <path d="M16,12 C15,4 20,0 30,0 C40,0 45,4 44,12 L44,20 C44,22 38,24 30,24 C22,24 16,22 16,20 Z"
        fill="#5e5e5e" stroke={C.ol} strokeWidth="0.8" />
      <path d="M16,17 L44,17 L44,20 C44,22 38,24 30,24 C22,24 16,22 16,20 Z"
        fill="#3a3a3a" opacity="0.55" />
      {/* Rail stubs */}
      <rect x="14" y="14" width="5" height="3" rx="0.8" fill="#444" stroke="#666" strokeWidth="0.4" />
      <rect x="41" y="14" width="5" height="3" rx="0.8" fill="#444" stroke="#666" strokeWidth="0.4" />
    </g>
  );
}

function BoonieHat() {
  return (
    <g>
      {/* Crown */}
      <path d="M18,12 C17,5 21,1 30,1 C39,1 43,5 42,12 L41,18 C41,19 36,21 30,21 C24,21 19,19 19,18 Z"
        fill={C.bgr} stroke={C.ol} strokeWidth="0.8" />
      {/* Wide floppy brim */}
      <path d="M9,17 C8,13 13,12 19,14 C24,17 36,17 41,14 C47,12 52,13 51,17 C50,21 46,22 41,20 C36,22 24,22 19,20 C13,22 8,21 9,17 Z"
        fill={C.bgs} stroke={C.ol} strokeWidth="0.8" />
    </g>
  );
}

function OpsHelmet() {
  return (
    <g>
      {/* FAST shell */}
      <path d="M15,12 C14,3 19,0 30,0 C41,0 46,3 45,12 L46,20 C46,22 40,25 30,25 C20,25 14,22 14,20 Z"
        fill="#242424" stroke={C.ol} strokeWidth="0.8" />
      {/* Side rail cutouts */}
      <path d="M14,14 L16,14 L17,21 L15,21 Z" fill="#333" />
      <path d="M46,14 L44,14 L43,21 L45,21 Z" fill="#333" />
      {/* Shroud mount */}
      <rect x="25" y="2" width="10" height="5" rx="1.2" fill="#303030" stroke="#555" strokeWidth="0.4" />
      {/* Retention strap line */}
      <path d="M15,20 C20,22 40,22 45,20" fill="none" stroke="#555" strokeWidth="0.9" opacity="0.6" />
    </g>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────

export default function PixelCharacter({ equipped = {}, size = 1, onClick }) {
  const equippedHead = equipped.head || 'beret_green';
  const equippedFace = equipped.face || null;
  const equippedBody = equipped.body || 'vest_basic';

  // Vest colour by item
  const vestFill =
    equippedBody === 'vest_plate'    ? '#48485a' :
    equippedBody === 'vest_arid'     ? '#8a7a5a' :
    equippedBody === 'vest_multicam' ? '#565840' : C.ves;
  const vestShade =
    equippedBody === 'vest_arid'     ? '#6a5a3a' :
    equippedBody === 'vest_multicam' ? '#3a3c28' : C.vsd;

  const svgW = 60 * size;
  const svgH = 54 * size;

  return (
    <svg
      width={svgW} height={svgH}
      viewBox="0 0 60 54"
      style={{ imageRendering: 'auto', cursor: onClick ? 'pointer' : 'default', overflow: 'visible' }}
      onClick={onClick}
    >
      {/* ── BOOTS ── */}
      {/* Left boot — toe extends forward (left) */}
      <path d="M13,49 L14,47 L25,47 L26,50 L26,54 L12,54 C11,54 11,52 13,49 Z"
        fill={C.bot} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="11" y="51" width="15" height="2.5" rx="0.6" fill={C.bsd} />
      {/* Right boot */}
      <path d="M34,47 L45,47 L47,49 C49,52 49,54 48,54 L34,54 L34,50 Z"
        fill={C.bot} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="34" y="51" width="15" height="2.5" rx="0.6" fill={C.bsd} />

      {/* ── LEGS — slight A-stance ── */}
      {/* Left leg */}
      <path d="M17,38 L26,38 L26,47 L14,47 Z"
        fill={C.pnt} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M22,38 L26,38 L26,47 L22,47 Z" fill={C.pnd} opacity="0.4" />
      {/* Right leg */}
      <path d="M34,38 L43,38 L46,47 L34,47 Z"
        fill={C.pnt} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M34,38 L38,38 L36,47 L34,47 Z" fill={C.pnd} opacity="0.4" />

      {/* ── ARMS ── */}
      {/* Left arm — slight outward angle */}
      <path d="M13,22 C10,23 9,31 10,40 L17,41 L18,22 Z"
        fill={C.uni} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M13,22 C11,23 10,31 11,40 L13,40 L15,22 Z" fill={C.und} opacity="0.35" />
      {/* Right arm */}
      <path d="M47,22 C50,23 51,31 50,40 L43,41 L42,22 Z"
        fill={C.uni} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M45,22 L47,22 C49,23 50,31 49,40 L47,40 Z" fill={C.und} opacity="0.35" />

      {/* ── BASE TORSO (uniform under vest) ── */}
      {/* V-taper: wider at shoulders, narrows to belt */}
      <path d="M14,21 C12,22 11,30 13,38 L47,38 C49,30 48,22 46,21 L37,19 L23,19 Z"
        fill={C.uni} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M40,19 L46,21 C48,28 47,36 47,38 L42,38 L41,21 Z" fill={C.und} opacity="0.3" />

      {/* ── BELT ── */}
      <rect x="15" y="35" width="30" height="5" rx="1.5"
        fill={C.blt} stroke={C.ol} strokeWidth="0.7" />
      {/* Buckle */}
      <rect x="27" y="35.5" width="6" height="4" rx="1" fill={C.bck} />
      <rect x="28.2" y="36.5" width="3.6" height="2" rx="0.5" fill="#f0d070" />

      {/* ── TACTICAL VEST ── */}
      {/* Main panel — slightly narrower than torso to show uniform peek */}
      <path d="M20,21 L40,21 L43,35 L17,35 Z"
        fill={vestFill} stroke={C.ol} strokeWidth="0.8" strokeLinejoin="round" />
      {/* Right-side shadow for depth */}
      <path d="M37,21 L40,21 L43,35 L39,35 Z" fill={vestShade} opacity="0.45" />
      {/* Shoulder straps — diagonal from chest to shoulder */}
      <path d="M22,21 L25,19 L29,20 L29,24 L21,25 Z"
        fill={vestFill} stroke={C.ol} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M38,21 L35,19 L31,20 L31,24 L39,25 Z"
        fill={vestFill} stroke={C.ol} strokeWidth="0.6" strokeLinejoin="round" />
      {/* Centre cummerbund strap */}
      <rect x="28" y="23.5" width="4" height="2" rx="0.6"
        fill={C.blt} stroke={C.ol} strokeWidth="0.4" />
      {/* Three mag pouches */}
      <rect x="20.5" y="25.5" width="6" height="8" rx="1.2"
        fill={C.pou} stroke={C.ol} strokeWidth="0.55" />
      <rect x="27"   y="25.5" width="6" height="8" rx="1.2"
        fill={C.pou} stroke={C.ol} strokeWidth="0.55" />
      <rect x="33.5" y="25.5" width="6" height="8" rx="1.2"
        fill={C.pou} stroke={C.ol} strokeWidth="0.55" />
      {/* Pouch bottom shadow */}
      <rect x="20.5" y="30.5" width="6" height="3" rx="0.6" fill={C.psd} opacity="0.5" />
      <rect x="27"   y="30.5" width="6" height="3" rx="0.6" fill={C.psd} opacity="0.5" />
      <rect x="33.5" y="30.5" width="6" height="3" rx="0.6" fill={C.psd} opacity="0.5" />

      {/* ── NECK ── */}
      <rect x="26" y="17" width="8" height="5" rx="2"
        fill={C.sk} stroke={C.ol} strokeWidth="0.8" />
      <rect x="28" y="17" width="4" height="5" rx="1" fill={C.skd} opacity="0.25" />

      {/* ── HEAD ── */}
      {/* Main head — strong angular jaw, slightly wider at cheeks */}
      <path d="M18,7 C17,7 16,9 16,11 L16,24 C16,29 22,33 30,33 C38,33 44,29 44,24 L44,11 C44,9 43,7 42,7 Z"
        fill={C.sk} stroke={C.ol} strokeWidth="1" strokeLinejoin="round" />
      {/* Cheek shadow — left */}
      <path d="M16,19 C16,25 18,30 22,32 C19,28 18,24 18,20 Z"
        fill={C.skd} opacity="0.28" />
      {/* Cheek shadow — right */}
      <path d="M44,19 C44,25 42,30 38,32 C41,28 42,24 42,20 Z"
        fill={C.skd} opacity="0.28" />
      {/* Ears */}
      <ellipse cx="16" cy="18" rx="2.4" ry="3.4"
        fill={C.sk} stroke={C.ol} strokeWidth="0.8" />
      <ellipse cx="44" cy="18" rx="2.4" ry="3.4"
        fill={C.sk} stroke={C.ol} strokeWidth="0.8" />

      {/* ── FACE ── */}
      {equippedFace === 'balaclava' ? (
        <g>
          <path d="M17,11 L43,11 L44,28 C44,31 38,33 30,33 C22,33 16,31 16,28 Z"
            fill="#252525" opacity="0.92" />
          {/* Eye slit */}
          <rect x="21" y="17" width="18" height="4" rx="1" fill={C.sk} />
          {/* Mouth slit */}
          <rect x="25" y="27" width="10" height="3" rx="0.8" fill="#181818" />
        </g>
      ) : (
        <g>
          {/* 5-o'clock shadow — lower third of face */}
          <path d="M18,23 C18,30 22,33 30,33 C38,33 42,30 42,23 C39,26 35,28 30,28 C25,28 21,26 18,23 Z"
            fill={C.sub} opacity="0.28" />

          {/* Eyes / face overlay */}
          {equippedFace === 'visor_amber' ? (
            /* Wraparound ballistic shades */
            <g>
              <path d="M16,15 L44,15 L44,21 C44,23 38,25 30,25 C22,25 16,23 16,21 Z"
                fill="#b86a10" opacity="0.92" stroke={C.ol} strokeWidth="0.6" strokeLinejoin="round" />
              {/* Glare strip */}
              <path d="M18,15 L42,15 L42,17 C42,17 38,18 30,18 C22,18 18,17 18,17 Z"
                fill="#fff" opacity="0.2" />
            </g>
          ) : equippedFace === 'nvg' ? (
            <g>
              <rect x="19" y="14" width="9" height="6" rx="3"
                fill="#141414" stroke={C.ol} strokeWidth="0.7" />
              <rect x="32" y="14" width="9" height="6" rx="3"
                fill="#141414" stroke={C.ol} strokeWidth="0.7" />
              <circle cx="23.5" cy="17" r="2.2" fill="#1e4a1a" />
              <circle cx="36.5" cy="17" r="2.2" fill="#1e4a1a" />
              <circle cx="24" cy="16.5" r="0.7" fill="#4aaa40" opacity="0.6" />
              <circle cx="37" cy="16.5" r="0.7" fill="#4aaa40" opacity="0.6" />
              {/* Bridge */}
              <rect x="28" y="16" width="4" height="2" rx="0.5" fill="#222" />
            </g>
          ) : (
            /* Default — tactical squint, narrow slitted eyes */
            <g>
              {/* Brow ridge shadow */}
              <path d="M20,13 C22,11 28,11 30,13" fill="none" stroke={C.skd} strokeWidth="0.8" opacity="0.5" />
              <path d="M30,13 C32,11 38,11 40,13" fill="none" stroke={C.skd} strokeWidth="0.8" opacity="0.5" />
              {/* Left eye — leaf/almond shape */}
              <path d="M20,17 C22,14.2 28,14.2 30,17 C28,18.5 22,18.5 20,17 Z"
                fill={C.eye} />
              {/* Right eye */}
              <path d="M30,17 C32,14.2 38,14.2 40,17 C38,18.5 32,18.5 30,17 Z"
                fill={C.eye} />
              {/* Iris highlight */}
              <circle cx="27" cy="16" r="0.9" fill={C.shi} opacity="0.55" />
              <circle cx="37" cy="16" r="0.9" fill={C.shi} opacity="0.55" />
            </g>
          )}

          {/* Nose — subtle bridge hint */}
          <path d="M29,21 C28,24 29,26 30,26 C31,26 32,24 31,21"
            fill="none" stroke={C.skd} strokeWidth="0.7" opacity="0.45" />
          {/* Mouth — stern, slightly downturned */}
          <path d="M24,29 C26,27.5 34,27.5 36,29"
            fill="none" stroke={C.sub} strokeWidth="1" opacity="0.55" />
        </g>
      )}

      {/* ── HEAD GEAR (topmost layer) ── */}
      {equippedHead === 'beret_green' && <BeretGreen />}
      {equippedHead === 'helmet_mk6'  && <HelmetMk6 />}
      {equippedHead === 'boonie_hat'  && <BoonieHat />}
      {equippedHead === 'ops_helmet'  && <OpsHelmet />}
    </svg>
  );
}
