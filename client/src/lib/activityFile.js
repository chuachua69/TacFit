/**
 * Parse a GPX or TCX activity file (Strava export, Garmin/Coros/watch export)
 * into { distanceM, durationS, paceSecPerKm, sport, format }.
 * Pure client-side — uses the browser DOMParser, no dependencies.
 */

const EARTH_R = 6371000; // metres

function haversine(a, b) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

function parseGPX(doc) {
  const pts = [...doc.getElementsByTagName('trkpt')].map(p => ({
    lat: parseFloat(p.getAttribute('lat')),
    lon: parseFloat(p.getAttribute('lon')),
    t: p.getElementsByTagName('time')[0]?.textContent,
  }));
  if (pts.length < 2) return null;

  let distanceM = 0;
  for (let i = 1; i < pts.length; i++) {
    if (!isNaN(pts[i].lat) && !isNaN(pts[i - 1].lat)) {
      distanceM += haversine(pts[i - 1], pts[i]);
    }
  }
  const times = pts.map(p => (p.t ? Date.parse(p.t) : NaN)).filter(t => !isNaN(t));
  const durationS = times.length >= 2 ? (times[times.length - 1] - times[0]) / 1000 : 0;
  const sport = doc.getElementsByTagName('type')[0]?.textContent || '';
  return { distanceM, durationS, sport, format: 'gpx' };
}

function parseTCX(doc) {
  let distanceM = 0;
  let durationS = 0;

  // Laps carry authoritative totals (also covers pool swims with no GPS)
  const laps = [...doc.getElementsByTagName('Lap')];
  laps.forEach(l => {
    const d = parseFloat(l.getElementsByTagName('DistanceMeters')[0]?.textContent);
    const t = parseFloat(l.getElementsByTagName('TotalTimeSeconds')[0]?.textContent);
    if (!isNaN(d)) distanceM += d;
    if (!isNaN(t)) durationS += t;
  });

  const tps = [...doc.getElementsByTagName('Trackpoint')];

  // Fallback distance: cumulative DistanceMeters or GPS positions
  if (!distanceM && tps.length) {
    const dvals = tps
      .map(p => parseFloat(p.getElementsByTagName('DistanceMeters')[0]?.textContent))
      .filter(v => !isNaN(v));
    if (dvals.length) {
      distanceM = Math.max(...dvals) - Math.min(...dvals);
    } else {
      const pos = tps
        .map(p => ({
          lat: parseFloat(p.getElementsByTagName('LatitudeDegrees')[0]?.textContent),
          lon: parseFloat(p.getElementsByTagName('LongitudeDegrees')[0]?.textContent),
        }))
        .filter(p => !isNaN(p.lat));
      for (let i = 1; i < pos.length; i++) distanceM += haversine(pos[i - 1], pos[i]);
    }
  }

  // Fallback duration from trackpoint timestamps
  if (!durationS && tps.length >= 2) {
    const ts = tps
      .map(p => Date.parse(p.getElementsByTagName('Time')[0]?.textContent))
      .filter(t => !isNaN(t));
    if (ts.length >= 2) durationS = (ts[ts.length - 1] - ts[0]) / 1000;
  }

  const sport = doc.getElementsByTagName('Activity')[0]?.getAttribute('Sport') || '';
  return { distanceM, durationS, sport, format: 'tcx' };
}

export function parseActivityFile(text, fileName = '') {
  let doc;
  try {
    doc = new DOMParser().parseFromString(text, 'application/xml');
  } catch {
    throw new Error('Could not read this file.');
  }
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('That file isn’t valid GPX/TCX.');
  }

  const root = (doc.documentElement?.nodeName || '').toLowerCase();
  let result = null;
  if (root === 'gpx' || /\.gpx$/i.test(fileName)) result = parseGPX(doc);
  else if (root.includes('trainingcenter') || /\.tcx$/i.test(fileName)) result = parseTCX(doc);
  else result = doc.getElementsByTagName('trkpt').length ? parseGPX(doc) : parseTCX(doc);

  if (!result || !(result.distanceM > 0) || !(result.durationS > 0)) {
    throw new Error('No usable distance/time found in this file.');
  }

  result.distanceM = Math.round(result.distanceM);
  result.durationS = Math.round(result.durationS);
  result.paceSecPerKm = result.durationS / (result.distanceM / 1000);
  return result;
}

export async function readFileText(file) {
  if (file.text) return file.text();
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Could not read file.'));
    r.readAsText(file);
  });
}
