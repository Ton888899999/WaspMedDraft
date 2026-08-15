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
 * Renders a slice into ImageData, applying rescale, windowing and inversion.
 * Real windowing presets are applied for CT; other modalities use the
 * file's own window or a min/max stretch.
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

  const values = grayValues(slice);
  let center: number;
  let width: number;
  if (isCT) {
    ({ center, width } = PRESET_WINDOWS[preset]);
  } else {
    center = slice.windowCenter;
    width = slice.windowWidth;
  }
  if (width <= 0) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
      if (values[i] < min) min = values[i];
      if (values[i] > max) max = values[i];
    }
    center = (min + max) / 2;
    width = Math.max(1, max - min);
  }
  const low = center - width / 2;
  const flip = inverted !== slice.monochrome1;

  for (let i = 0; i < values.length; i++) {
    let g = Math.round(((values[i] - low) / width) * 255);
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    if (flip) g = 255 - g;
    out[i * 4] = g;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = g;
    out[i * 4 + 3] = 255;
  }
  return new ImageData(out, w, h);
}

export function sliceGrayValues(slice: DicomSlice): Float32Array {
  return grayValues(slice);
}

function grayValues(slice: DicomSlice): Float32Array {
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
