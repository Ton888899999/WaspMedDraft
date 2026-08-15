import { WindowPreset } from '../types';
import { DicomSlice } from './study';

/**
 * Window presets in HU (meaningful for CT after rescale). For non-CT
 * modalities the values stored in the file (or min/max stretch) are used.
 */
const PRESET_WINDOWS: Record<WindowPreset, { center: number; width: number }> = {
  soft_tissue: { center: 40, width: 400 },
  bone: { center: 300, width: 1500 },
  lung: { center: -600, width: 1500 },
  brain: { center: 40, width: 80 },
};

/**
 * Renders a slice into ImageData, applying rescale, windowing and
 * inversion in a single pass over the raw pixel data (no intermediate
 * float buffer — this runs on every scroll step of a 500-slice series).
 */
export function renderSliceToImageData(
  slice: DicomSlice,
  preset: WindowPreset,
  inverted: boolean,
  isCT: boolean,
): ImageData {
  const w = slice.columns;
  const h = slice.rows;
  const out = new Uint8ClampedArray(w * h * 4);

  if (slice.samplesPerPixel === 3 && slice.bitsAllocated === 8) {
    const n = w * h;
    for (let i = 0; i < n; i++) {
      const r = slice.pixelBytes[i * 3];
      const g = slice.pixelBytes[i * 3 + 1];
      const b = slice.pixelBytes[i * 3 + 2];
      out[i * 4] = inverted ? 255 - r : r;
      out[i * 4 + 1] = inverted ? 255 - g : g;
      out[i * 4 + 2] = inverted ? 255 - b : b;
      out[i * 4 + 3] = 255;
    }
    return new ImageData(out, w, h);
  }

  const n = w * h;
  const { rescaleSlope: slope, rescaleIntercept: intercept } = slice;
  const is8bit = slice.bitsAllocated === 8;
  const view = is8bit
    ? null
    : new DataView(slice.pixelBytes.buffer, slice.pixelBytes.byteOffset, slice.pixelBytes.byteLength);
  const count = is8bit
    ? Math.min(n, slice.pixelBytes.length)
    : Math.min(n, Math.floor(slice.pixelBytes.length / 2));

  const readRaw = (i: number): number =>
    is8bit
      ? slice.pixelBytes[i]
      : slice.signed
        ? view!.getInt16(i * 2, true)
        : view!.getUint16(i * 2, true);

  let center: number;
  let width: number;
  if (isCT) {
    ({ center, width } = PRESET_WINDOWS[preset]);
  } else {
    center = slice.windowCenter;
    width = slice.windowWidth;
  }
  if (width <= 0) {
    // No usable window: stretch to the actual raw value range.
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < count; i++) {
      const v = readRaw(i);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    center = ((min + max) / 2) * slope + intercept;
    width = Math.max(1, (max - min) * Math.abs(slope));
  }

  // Fold rescale + windowing into one linear map: g = raw * scale + offset.
  const low = center - width / 2;
  const scale = (255 * slope) / width;
  const offset = (255 * (intercept - low)) / width;
  const flip = inverted !== slice.monochrome1;

  for (let i = 0; i < count; i++) {
    let g = readRaw(i) * scale + offset;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    if (flip) g = 255 - g;
    const o = i * 4;
    out[o] = g;
    out[o + 1] = g;
    out[o + 2] = g;
    out[o + 3] = 255;
  }
  return new ImageData(out, w, h);
}

/** Rescaled (HU for CT) values of a slice — used by the analyzer. */
export function sliceGrayValues(slice: DicomSlice): Float32Array {
  const n = slice.rows * slice.columns;
  const result = new Float32Array(n);
  const { rescaleSlope: s, rescaleIntercept: b } = slice;
  if (slice.bitsAllocated === 8) {
    const count = Math.min(n, slice.pixelBytes.length);
    for (let i = 0; i < count; i++) {
      result[i] = slice.pixelBytes[i] * s + b;
    }
  } else {
    const view = new DataView(
      slice.pixelBytes.buffer,
      slice.pixelBytes.byteOffset,
      slice.pixelBytes.byteLength,
    );
    const count = Math.min(n, Math.floor(slice.pixelBytes.length / 2));
    for (let i = 0; i < count; i++) {
      const raw = slice.signed ? view.getInt16(i * 2, true) : view.getUint16(i * 2, true);
      result[i] = raw * s + b;
    }
  }
  return result;
}
