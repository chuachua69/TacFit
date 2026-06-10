// Standard plate sizes in kg and lbs
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];

const BAR_OPTIONS_KG = [
  { label: 'Olympic (20kg)', value: 20 },
  { label: 'Women\'s (15kg)', value: 15 },
  { label: 'Standard (10kg)', value: 10 },
];
const BAR_OPTIONS_LBS = [
  { label: 'Olympic (45lbs)', value: 45 },
  { label: 'Women\'s (35lbs)', value: 35 },
  { label: 'Standard (25lbs)', value: 25 },
];

export function getBarOptions(unit) {
  return unit === 'lbs' ? BAR_OPTIONS_LBS : BAR_OPTIONS_KG;
}

export function calcPlatesPerSide(targetWeight, barWeight, unit) {
  const plates = unit === 'lbs' ? PLATES_LBS : PLATES_KG;
  let remaining = (targetWeight - barWeight) / 2;
  if (remaining <= 0) return [];

  const result = [];
  for (const plate of plates) {
    while (remaining >= plate - 0.001) {
      result.push(plate);
      remaining -= plate;
      remaining = Math.round(remaining * 1000) / 1000;
    }
  }
  return result;
}

export function plateColour(weight, unit) {
  if (unit === 'kg') {
    if (weight >= 25) return '#e05252';
    if (weight >= 20) return '#5280e0';
    if (weight >= 15) return '#e0c252';
    if (weight >= 10) return '#52c878';
    if (weight >= 5) return '#e0e0e0';
    return '#888';
  } else {
    if (weight >= 45) return '#e05252';
    if (weight >= 35) return '#5280e0';
    if (weight >= 25) return '#e0c252';
    if (weight >= 10) return '#52c878';
    return '#e0e0e0';
  }
}
