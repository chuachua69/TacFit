import { ITEMS } from '../store/character';

// 4px per pixel cell. Character is 14 wide x 22 tall = 56x88px
const PX = 4;
const W = 14;

// Color palette
const C = {
  _: null,           // transparent
  O: '#0a0a0f',      // outline
  s: '#9a6540',      // skin
  H: '#2d3d1f',      // helmet default (overridden by item)
  h: '#1a2410',      // helmet dark
  v: '#e07030',      // visor default
  A: '#2d3540',      // armor/vest default
  a: '#1e2838',      // armor dark
  B: '#8a7040',      // belt buckle
  P: '#1e2535',      // pants
  p: '#161c28',      // pants dark
  K: '#12121a',      // boots
  k: '#0a0a12',      // boots dark
  w: '#e0e0e0',      // white/highlight
};

// Base character rows (no head gear, no face gear, no vest — those are layers)
const BASE_ROWS = [
  '______OOOO______',  // 0  helmet base (rendered by head layer)
  '_____OOOOOO_____',  // 1
  '____OOOOOOOO____',  // 2
  '____OOOOOOOO____',  // 3
  '____OssssssO____',  // 4  face
  '____OssssssO____',  // 5
  '_____OssssO_____',  // 6  neck
  '___OOAAAAAaOO___',  // 7  shoulders
  '___OAAAAAAAAAo__',  // 8  upper torso
  '___OABBBBBBAo___',  // 9  belt
  '___OAAAAAAaAO___',  // 10
  '___OOPPPPPPoO___',  // 11 upper legs
  '_____OPPPPpO____',  // 12
  '_____OPPPPpO____',  // 13
  '____OpO___OpO___',  // 14 lower legs
  '____OKKO__OKKO__',  // 15 boots
  '____OkkO__OkkO__',  // 16
];

// Head item pixel overlays (rows 0-6, same width)
const HEAD_OVERLAYS = {
  beret_green:  [
    '____HHHHHHHH____',
    '___HHHHHHHHHH___',
    '____HHHHHHHH____',
    null, null, null, null,
  ],
  helmet_mk6: [
    '___HHHHHHHHHH___',
    '__HHhHHHHHhHH___',
    '__HHHHHHHHhHH___',
    '__hHHHHHHHHHh___',
    null, null, null,
  ],
  boonie_hat: [
    '___HHHHHHHHHH___',
    '__HHHHHHHHHHHH__',
    '_HHHHHHHHHHHHHH_',
    null, null, null, null,
  ],
  ops_helmet: [
    '__HHHHHHHHhHH___',
    '__HHhHHHHHhHH___',
    '__HHHHHHHHHhH___',
    '__hHHHHHHHHHh___',
    null, null, null,
  ],
};

// Face item overlays (rows 3-5)
const FACE_OVERLAYS = {
  visor_amber: [
    '____OvvvvvvO____',
    '____OvvvvvvO____',
    null,
  ],
  nvg: [
    '____OOOOOOO_____',
    '___OvOOOvO______',
    null,
  ],
  balaclava: [
    '____OSSSSSSOO___',
    '____OSSSSSSOO___',
    '____OSSSSSOO____',
  ],
};

// Body overlays (rows 7-10)
const BODY_OVERLAYS = {
  vest_basic: [
    '___OOAAAAAOOO___',
    '___OAAAAAAAOO___',
    '___OAABABAAOO___',
    '___OAAAAAAAOO___',
  ],
  vest_plate: [
    '___OOaAAAAOOO___',
    '___OaAAaAAAOO___',
    '___OaABABAAOO___',
    '___OaAAAAAaOO___',
  ],
  vest_arid: [
    '___OOAAAAAOOO___',
    '___OAHAAHAHOO___',
    '___OAHBABHAOO___',
    '___OAHAHAAOO____',
  ],
  vest_multicam: [
    '___OOAAHAHOOO___',
    '___OAHAHAAHOO___',
    '___OAHBABHAOOO__',
    '___OAHAHAAAOO___',
  ],
};

function rowToPixels(row, overrideColors = {}) {
  if (!row) return [];
  const pixels = [];
  for (let x = 0; x < row.length; x++) {
    const ch = row[x];
    const color = overrideColors[ch] || C[ch];
    if (color) pixels.push({ x, color });
  }
  return pixels;
}

export default function PixelCharacter({ equipped = {}, size = 1, onClick }) {
  const headItem = ITEMS.find(i => i.id === equipped.head);
  const faceItem = ITEMS.find(i => i.id === equipped.face);
  const bodyItem = ITEMS.find(i => i.id === equipped.body);

  const headColor = headItem?.color || '#2d3d1f';
  const faceColor = faceItem?.color || '#e07030';
  const bodyColor = bodyItem?.color || '#2d3540';

  const svgW = W * PX * size;
  const svgH = BASE_ROWS.length * PX * size;

  const rects = [];

  BASE_ROWS.forEach((row, rowIdx) => {
    const pixels = rowToPixels(row);
    pixels.forEach(({ x, color }) => {
      rects.push(
        <rect key={`b-${rowIdx}-${x}`}
          x={x * PX * size} y={rowIdx * PX * size}
          width={PX * size} height={PX * size}
          fill={color} />
      );
    });
  });

  // Head overlay
  const headOverlay = headItem ? HEAD_OVERLAYS[headItem.id] : HEAD_OVERLAYS['beret_green'];
  if (headOverlay) {
    headOverlay.forEach((row, rowIdx) => {
      if (!row) return;
      rowToPixels(row, { H: headColor, h: headColor + 'bb' }).forEach(({ x, color }) => {
        rects.push(
          <rect key={`h-${rowIdx}-${x}`}
            x={x * PX * size} y={rowIdx * PX * size}
            width={PX * size} height={PX * size}
            fill={color} />
        );
      });
    });
  }

  // Face overlay (rows 3-5)
  const faceOverlay = faceItem ? FACE_OVERLAYS[faceItem.id] : FACE_OVERLAYS['visor_amber'];
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

  // Body overlay (rows 7-10)
  const bodyOverlay = bodyItem ? BODY_OVERLAYS[bodyItem.id] : BODY_OVERLAYS['vest_basic'];
  if (bodyOverlay) {
    bodyOverlay.forEach((row, i) => {
      const rowIdx = i + 7;
      if (!row) return;
      rowToPixels(row, { A: bodyColor, a: bodyColor, H: headColor }).forEach(({ x, color }) => {
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
