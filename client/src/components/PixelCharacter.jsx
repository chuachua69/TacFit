import { ITEMS } from '../store/character';

const PX = 4;
const W = 16;

const C = {
  _: null,
  O: '#0a0a0f',
  s: '#c8836a',    // skin
  e: '#2a1208',    // eye
  m: '#7a3020',    // mouth
  H: '#2d3d1f',    // head item (overridden)
  h: '#1a2410',    // head item dark
  v: '#e07030',    // face item (overridden)
  A: '#2d3540',    // body item (overridden)
  a: '#1a2030',    // body item shadow
  B: '#c8a040',    // belt buckle gold
  b: '#5a4020',    // belt dark
  P: '#1e2535',    // pants
  p: '#141824',    // pants shadow
  K: '#181818',    // boots
  k: '#0c0c0c',    // boots shadow
};

// 16-wide pixel grid. Each char = 1 pixel cell.
const BASE_ROWS = [
  '_____OOOOOO_____',  // 0  skull top
  '____OssssssO____',  // 1  forehead
  '____OssssssO____',  // 2  upper face
  '____OseeseeO____',  // 3  eyes
  '____OssssssO____',  // 4  nose
  '____OssmssO_____',  // 5  mouth
  '_____OssssO_____',  // 6  chin
  '____OOAAAAaOO___',  // 7  collar/shoulders
  '___OAAAAAAAAaO__',  // 8  upper chest
  '___OAAvAAAvAO___',  // 9  chest pouches
  '___OAAAAAbAAO___',  // 10 mid torso
  '___OAAbBBBAaOO__',  // 11 belt
  '___OOPPPPPPpOO__',  // 12 hips
  '_____OPPPPpO____',  // 13 upper legs
  '_____OPPPPpO____',  // 14 lower legs
  '____OPpO__OPpO__',  // 15 boot tops
  '____OKKO__OKKO__',  // 16 boots
  '___OkkkO__OkkkO_',  // 17 boot soles
];

// Head overlays — rows 0-5 (index = row number)
const HEAD_OVERLAYS = {
  beret_green: [
    '___HHHHHHHHHHHH_',  // 0: wide beret crown
    '___HHHHHHHHHHHH_',  // 1: beret body
    '____HHHHHHHhh___',  // 2: beret drape
    null, null, null,
  ],
  helmet_mk6: [
    '___HHHHHHHHHHHH_',  // 0
    '__HHHHHHHHHHHhH_',  // 1: wide shell
    '__HHHhHHHHHhHHH_',  // 2: brow shadow
    null, null, null,
  ],
  boonie_hat: [
    '____HHHHHHHh____',  // 0: crown
    '__HHHHHHHHHHHHh_',  // 1: wide floppy brim
    null, null, null, null,
  ],
  ops_helmet: [
    '__HHHHHHHHHHHhH_',  // 0: ops-core shell
    '__HHhHHHHHHHhHH_',  // 1: rail shadow
    '__HHHHHHHHHHhHH_',  // 2: brow
    null, null, null,
  ],
};

// Face overlays — startRow = 3, index 0 = row 3
const FACE_OVERLAYS = {
  visor_amber: [
    '____OvvvvvvO____',  // row 3: eye-level visor strip
    null,                 // row 4: nose visible
    null,                 // row 5: mouth visible
  ],
  nvg: [
    '____OvvOvvOO____',  // row 3: dual NVG lenses
    null,
    null,
  ],
  balaclava: [
    '____OvvvvvvO____',  // row 3
    '____OvvvvvvO____',  // row 4
    '____OvvmvvO_____',  // row 5: mouth slit
  ],
};

// Body overlays — startRow = 7, index 0 = row 7
const BODY_OVERLAYS = {
  vest_basic: [
    null,                    // row 7: base collar
    '___OAAAAAAAAAo__',   // row 8
    '___OAAvAAAvAO___',   // row 9: mag pouches
    '___OAAAAAbAAO___',   // row 10
    '___OAABBBBBaOO__',  // row 11: belt + buckle
  ],
  vest_plate: [
    null,
    '___OAaAAAAaaAO__',   // row 8: plate stitching
    '___OAaaAAbaaAO__',  // row 9
    '___OAaAABBaaAO__',  // row 10
    '___OAABBBBBaOO__',  // row 11
  ],
  vest_arid: [
    null,
    '___OAAAAAAAAAo__',
    '___OAAvAAAvAO___',
    '___OAAAAAbAAO___',
    '___OAABBBBBaOO__',
  ],
  vest_multicam: [
    null,
    '___OAAaAAAAaAO__',
    '___OAavAAAvAaO__',
    '___OAAaAbAAaO___',
    '___OAABBBBBaOO__',
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
  const bodyColor = bodyItem?.color || '#2d3540';

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
      rowToPixels(row, { H: headColor, h: headColor }).forEach(({ x, color }) => {
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
