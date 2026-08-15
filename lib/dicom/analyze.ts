import { DicomSlice, DicomStudy } from './study';
import { sliceGrayValues } from './render';

/**
 * A region of statistically anomalous density found in the pixel data.
 * This is honest image statistics — an attention cue for the physician,
 * NOT a diagnosis: local mean intensity deviating strongly from the
 * slice-wide distribution of comparable tissue blocks.
 */
export interface AttentionRegion {
  sliceNumber: number; // 1-based
  cx: number; // percent 0-100
  cy: number;
  rx: number;
  ry: number;
  score: number; // robust z-score of the deviation
  meanValue: number; // mean intensity of the region (HU for CT)
  label: string;
}

interface BlockGrid {
  cols: number;
  rows: number;
  means: Float32Array;
  bodyFrac: Float32Array;
}

/**
 * Scans the study for regions whose local density deviates from the rest
 * of the tissue on that slice. Yields to the event loop regularly so the
 * UI stays responsive on large series.
 */
export async function analyzeStudyAttention(
  study: DicomStudy,
  onProgress?: (percent: number) => void,
): Promise<AttentionRegion[]> {
  const renderable = study.slices
    .map((slice, i) => ({ slice, index: i }))
    .filter((s) => s.slice.renderable && s.slice.samplesPerPixel === 1);
  if (renderable.length === 0) return [];

  // Cap the work: analyze at most ~120 slices spread across the series.
  const step = Math.max(1, Math.ceil(renderable.length / 120));
  const isCT = study.modality.toUpperCase() === 'CT';
  const candidates: AttentionRegion[] = [];

  for (let n = 0; n < renderable.length; n += step) {
    const { slice, index } = renderable[n];
    const region = analyzeSlice(slice, index + 1, isCT);
    if (region) candidates.push(region);
    if (n % (step * 8) === 0) {
      onProgress?.(Math.round((n / renderable.length) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  onProgress?.(100);

  // Keep the strongest regions, spaced apart in the series so three
  // findings don't all point at neighbouring slices of the same spot.
  candidates.sort((a, b) => b.score - a.score);
  const minGap = Math.max(2, Math.round(study.slices.length / 12));
  const picked: AttentionRegion[] = [];
  for (const c of candidates) {
    if (c.score < 2.6) break; // below this the deviation is unremarkable
    if (picked.some((p) => Math.abs(p.sliceNumber - c.sliceNumber) < minGap)) continue;
    picked.push(c);
    if (picked.length >= 3) break;
  }
  return picked;
}

function analyzeSlice(slice: DicomSlice, sliceNumber: number, isCT: boolean): AttentionRegion | null {
  const values = sliceGrayValues(slice);
  const { rows, columns } = slice;
  const bs = Math.max(8, Math.floor(Math.min(rows, columns) / 24));
  const gcols = Math.floor(columns / bs);
  const grows = Math.floor(rows / bs);
  if (gcols < 4 || grows < 4) return null;

  const grid: BlockGrid = {
    cols: gcols,
    rows: grows,
    means: new Float32Array(gcols * grows),
    bodyFrac: new Float32Array(gcols * grows),
  };

  // Threshold separating body tissue from air/background.
  let bodyThreshold: number;
  if (isCT) {
    bodyThreshold = -400; // HU
  } else {
    let max = -Infinity;
    for (let i = 0; i < values.length; i += 7) if (values[i] > max) max = values[i];
    bodyThreshold = max * 0.12;
  }

  for (let gy = 0; gy < grows; gy++) {
    for (let gx = 0; gx < gcols; gx++) {
      let sum = 0;
      let body = 0;
      let count = 0;
      for (let y = gy * bs; y < (gy + 1) * bs; y++) {
        const rowOff = y * columns;
        for (let x = gx * bs; x < (gx + 1) * bs; x++) {
          const v = values[rowOff + x];
          count++;
          if (v > bodyThreshold) {
            body++;
            sum += v;
          }
        }
      }
      const gi = gy * gcols + gx;
      grid.bodyFrac[gi] = body / count;
      grid.means[gi] = body > 0 ? sum / body : bodyThreshold;
    }
  }

  // Blocks that are mostly tissue and not on the image border
  // (borders collect couch, coils and reconstruction artifacts).
  const usable: number[] = [];
  for (let gy = 1; gy < grows - 1; gy++) {
    for (let gx = 1; gx < gcols - 1; gx++) {
      const gi = gy * gcols + gx;
      if (grid.bodyFrac[gi] > 0.6) usable.push(gi);
    }
  }
  if (usable.length < 12) return null;

  // Robust statistics over tissue blocks: median + MAD. The MAD is
  // floored so nearly-uniform tissue doesn't blow up the z-score, and a
  // minimum absolute deviation is required (a few HU of texture noise is
  // never worth flagging, however "statistically significant").
  const means = usable.map((gi) => grid.means[gi]).sort((a, b) => a - b);
  const median = means[Math.floor(means.length / 2)];
  const spread = Math.max(
    means[Math.floor(means.length * 0.9)] - means[Math.floor(means.length * 0.1)],
    1e-3,
  );
  const absDev = usable.map((gi) => Math.abs(grid.means[gi] - median)).sort((a, b) => a - b);
  const madFloor = isCT ? 6 : spread * 0.04;
  const mad = Math.max(absDev[Math.floor(absDev.length / 2)], madFloor);
  const minAbsDev = isCT ? 25 : spread * 0.45;

  let bestGi = -1;
  let bestScore = 0;
  for (const gi of usable) {
    const dev = Math.abs(grid.means[gi] - median);
    if (dev < minAbsDev) continue;
    const score = dev / (mad * 1.4826);
    if (score > bestScore) {
      bestScore = score;
      bestGi = gi;
    }
  }
  if (bestGi < 0) return null;

  // Grow the region over neighbouring blocks with a comparable deviation.
  const bx = bestGi % gcols;
  const by = Math.floor(bestGi / gcols);
  let minX = bx, maxX = bx, minY = by, maxY = by;
  let regionSum = grid.means[bestGi];
  let regionCount = 1;
  for (let gy = Math.max(0, by - 2); gy <= Math.min(grows - 1, by + 2); gy++) {
    for (let gx = Math.max(0, bx - 2); gx <= Math.min(gcols - 1, bx + 2); gx++) {
      const gi = gy * gcols + gx;
      if (gi === bestGi || grid.bodyFrac[gi] < 0.5) continue;
      const score = Math.abs(grid.means[gi] - median) / (mad * 1.4826);
      if (score > bestScore * 0.55) {
        minX = Math.min(minX, gx);
        maxX = Math.max(maxX, gx);
        minY = Math.min(minY, gy);
        maxY = Math.max(maxY, gy);
        regionSum += grid.means[gi];
        regionCount++;
      }
    }
  }

  const cx = (((minX + maxX + 1) / 2) * bs / columns) * 100;
  const cy = (((minY + maxY + 1) / 2) * bs / rows) * 100;
  const rx = Math.max(3.5, ((maxX - minX + 1) * bs / columns) * 55);
  const ry = Math.max(3.5, ((maxY - minY + 1) * bs / rows) * 55);
  const meanValue = regionSum / regionCount;

  const direction = meanValue > median ? 'повышенной' : 'пониженной';
  return {
    sliceNumber,
    cx,
    cy,
    rx: Math.min(rx, 22),
    ry: Math.min(ry, 22),
    score: bestScore,
    meanValue,
    label: `Зона ${direction} плотности${isCT ? ` · ${Math.round(meanValue)} HU` : ''}`,
  };
}
