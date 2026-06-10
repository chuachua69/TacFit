import { ITEMS } from '../store/character';

const PX = 3;
const W = 20;

const C = {
  _: null,
  O: '#0a0a0f',    // outline
  s: '#c8906a',    // skin
  b: '#5a3010',    // eyebrow
  e: '#1a1008',    // eye dark
  m: '#7a3a20',    // mouth
  H: '#3d5c2a',    // head item (overridden)
  h: '#2a4018',    // head item shadow
  G: '#c8a040',    // badge gold
  v: '#e07030',    // face item (overridden)
  A: '#4a6035',    // body item (overridden)
  a: '#344825',    // body item shadow
  c: '#c8c8a0',    // collar/undershirt
  B: '#8a6035',    // belt
  g: '#c8a040',    // belt buckle gold
  P: '#2a3822',    // pants
  p: '#1a2818',    // pants shadow
  K: '#5a3a1a',    // boots brown
  k: '#3a2210',    // boots shadow
};

// 20-wide retro-bit character. Each char = 1 pixel cell.
const BASE_ROWS = [
  '____OOOOOOOOOOOO____',  // 0  skull top
  '____OssssssssssO____',  // 1  forehead
  '____OsbbsssbbsO_____',  // 2  eyebrows
  '____OseesseesO______',  // 3  eyes
  '____OssssssssO______',  // 4  nose/cheeks
  '_____OssmmssO_______',  // 5  mouth
  '_____OssssssO_______',  // 6  chin/jaw
  '____OOcAAAAccOO_____',  // 7  neck + collar
  '___OAAcAAAAAcAAO____',  // 8  upper chest with lapels
  '___OAAAcAAAAcAAO____',  // 9  chest
  '___OAAAAAAAAAAAAo___',  // 10 torso
  '___OAAAgBBBgAAO_____',  // 11 belt + buckle
  '___OOPPPPPPPpOO_____',  // 12 hips
  '_____OPPPPpPO_______',  // 13 upper legs
  '_____OPPPPpPO_______',  // 14 lower legs
  '____OPpO__OPpO______',  // 15 boot tops
  '____OKKO__OKKO______',  // 16 boots
  '___OKKkO__OKKkO_____',  // 17 boot soles
];

// Head overlays — index = row number (0-5)
const HEAD_OVERLAYS = {
  beret_green: [
    '__HHHHHHHHHHHHHHHH__',  // 0 wide beret crown
    '__HHHHHGHHHHHhHHHH__', // 1 beret body + gold badge
    null, null, null, null,  // 2-5 face shows
  ],
  helmet_mk6: [
    '___HHHHHHHHHHHHHH___',  // 0 dome
    '__HHHHHHHHHHHHHHhH__', // 1 wide shell
    '__HHHhHHHHHHHhHHH___', // 2 brow shadow (covers eyebrows)
    null, null, null,
  ],
  boonie_hat: [
    '____HHHHHHHHHHhH____',  // 0 crown
    '_HHHHHHHHHHHHHHHhHH_',  // 1 wide floppy brim
    null, null, null, null,
  ],
  ops_helmet: [
    '__HHHHHHHHHHHHHHhH__',  // 0 ops-core shell
    '__HHhHHHHHHHHHhHHH__',  // 1 rail shadow
    '__HHHHHHHHHHHHhHHH__',  // 2 brow mount
    null, null, null,
  ],
};

// Face overlays — startRow=3, index 0 = row 3
const FACE_OVERLAYS = {
  visor_amber: [
    '____OvvvvvvvvO______',  // row 3 eye-level visor
    null,                     // row 4 nose shows
    null,                     // row 5 mouth shows
  ],
  nvg: [
    '___OOvvvOvvvOO______',  // row 3 dual NVG lenses
    null,
    null,
  ],
  balaclava: [
    '____OvvvvvvvvO______',  // row 3
    '____OvvvvvvvvO______',  // row 4
    '_____OvvmmvvO_______',  // row 5 mouth slit
  ],
};

// Body overlays — startRow=7, index 0 = row 7
const BODY_OVERLAYS = {
  vest_basic: [
    null,
    '___OAAcAAAAAcAAO____',   // row 8
    '___OAAAcAAAAcAAO____',   // row 9
    '___OAAAAAAAAAAAAo___',   // row 10
    '___OAAAgBBBgAAO_____',  // row 11
  ],
  vest_plate: [
    null,
    '___OAaaAAAAaAAO_____',   // plate stitching
    '___OAaaAAAAaAAO_____',
    '___OAAAAAAAAAaAO____',
    '___OAAAgBBBgAAO_____',
  ],
  vest_arid: [
    null,
    '___OAAcAAAAAcAAO____',
    '___OAAAcAAAAcAAO____',
    '___OAAAAAAAAAAAAo___',
    '___OAAAgBBBgAAO_____',
  ],
  vest_multicam: [
    null,
    '___OAAaAAAAaAAO_____',
    '___OAaAAAAaaAAO_____',
    '___OAAAAaAAAAAaO____',
    '___OAAAgBBBgAAO_____',
  ],
};

function rowToPixels(row, overrideColors = {}) {
  if (!row) return [];
  const pixels = [];
  for (let x = 0; x < row.length; x++) {
    const ch = row[x];
    const color = overrideColors[ch] ?? C[ch];
    if (color) pixels.push({ x, color });
  }
  return pixels;
}

export default function PixelCharacter({ equipped = {}, size = 1, onClick }) {
  const headItem = ITEMS.find(i => i.id === equipped.head);
  const faceItem = ITEMS.find(i => i.id === equipped.face);
  const bodyItem = ITEMS.find(i => i.id === equipped.body);

  const headColor = headItem?.color || '#3d5a2a';
  const faceColor = faceItem?.color || '#e07030';
  const bodyColor = bodyItem?.color || '#4a6035';

  const svgW = W * PX * size;
  const svgH = BASE_ROWS.length * PX * size;

  const rects = [];

  // Base layer
  BASE_ROWS.forEach((row, rowIdx) => {
    rowToPixels(row).forEach(({ x, color }) => {
      rects.push(
        <rect key={`b-${rowIdx}-${x}`}
          x={x * PX * size} y={rowIdx * PX * size}
          width={PX * size} height={PX * size}
          fill={color} />
      );
    });
  });

  // Head overlay (rows 0-5)
  const headOverlay = headItem ? HEAD_OVERLAYS[headItem.id] : HEAD_OVERLAYS['beret_green'];
  if (headOverlay) {
    headOverlay.forEach((row, rowIdx) => {
      if (!row) return;
      rowToPixels(row, { H: headColor, h: headColor, G: '#c8a040' }).forEach(({ x, color }) => {
        rects.push(
          <rect key={`h-${rowIdx}-${x}`}
            x={x * PX * size} y={rowIdx * PX * size}
            width={PX * size} height={PX * size}
            fill={color} />
        );
      });
    });
  }

  // Face overlay (rows 3-5, offset = 3)
  const faceOverlay = faceItem ? FACE_OVERLAYS[faceItem.id] : null;
  if (faceOverlay) {
    faceOverlay.forEach((row, i) => {
      const rowIdx = i + 3;
      if (!row) return;
      rowToPixels(row, { v: faceColor }).forEach(({ x, color }) => {
        rects.push(
          <rect key={`f-${i}-${x}`}
            x={x * PX * size} y={rowIdx * PX * size}
            width={PX * size} height={PX * size}
            fill={color} />
        );
      });
    });
  }

  // Body overlay (rows 7-11, offset = 7)
  const bodyOverlay = bodyItem ? BODY_OVERLAYS[bodyItem.id] : BODY_OVERLAYS['vest_basic'];
  if (bodyOverlay) {
    bodyOverlay.forEach((row, i) => {
      const rowIdx = i + 7;
      if (!row) return;
      rowToPixels(row, { A: bodyColor, a: bodyColor }).forEach(({ x, color }) => {
        rects.push(
          <rect key={`v-${i}-${x}`}
            x={x * PX * size} y={rowIdx * PX * size}
            width={PX * size} height={PX * size}
            fill={color} />
        );
      });
    });
  }

  return (
    <svg
      width={svgW} height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ imageRendering: 'pixelated', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}>
      {rects}
    </svg>
  );
}
