/**
 * Minimal DICOM parser: little-endian explicit/implicit VR, uncompressed
 * pixel data (MONOCHROME1/2, RGB). Compressed transfer syntaxes are parsed
 * for metadata only — such slices are marked as not renderable.
 */

export const DicomTag = {
  transferSyntax: 0x00020010,
  patientName: 0x00100010,
  patientId: 0x00100020,
  patientSex: 0x00100040,
  patientAge: 0x00101010,
  studyDate: 0x00080020,
  studyTime: 0x00080030,
  modality: 0x00080060,
  studyDescription: 0x00081030,
  seriesDescription: 0x0008103e,
  institutionName: 0x00080080,
  manufacturerModel: 0x00081090,
  bodyPart: 0x00180015,
  sliceThickness: 0x00180050,
  instanceNumber: 0x00200013,
  sliceLocation: 0x00201041,
  samplesPerPixel: 0x00280002,
  photometric: 0x00280004,
  rows: 0x00280010,
  columns: 0x00280011,
  bitsAllocated: 0x00280100,
  pixelRepresentation: 0x00280103,
  windowCenter: 0x00281050,
  windowWidth: 0x00281051,
  rescaleIntercept: 0x00281052,
  rescaleSlope: 0x00281053,
  pixelData: 0x7fe00010,
} as const;

const UNCOMPRESSED = new Set(['1.2.840.10008.1.2', '1.2.840.10008.1.2.1']);

const KNOWN_VRS = new Set([
  'AE', 'AS', 'AT', 'CS', 'DA', 'DS', 'DT', 'FL', 'FD', 'IS', 'LO', 'LT',
  'OB', 'OD', 'OF', 'OL', 'OW', 'PN', 'SH', 'SL', 'SQ', 'SS', 'ST', 'TM',
  'UC', 'UI', 'UL', 'UN', 'UR', 'US', 'UT',
]);

const LONG_VRS = new Set(['OB', 'OD', 'OF', 'OL', 'OW', 'SQ', 'UC', 'UN', 'UR', 'UT']);

export class DicomDataset {
  private raw = new Map<number, Uint8Array>();
  transferSyntaxUid = '1.2.840.10008.1.2.1';

  has(tag: number): boolean {
    return this.raw.has(tag);
  }

  bytes(tag: number): Uint8Array | undefined {
    return this.raw.get(tag);
  }

  put(tag: number, value: Uint8Array): void {
    this.raw.set(tag, value);
  }

  get size(): number {
    return this.raw.size;
  }

  string(tag: number): string | null {
    const v = this.raw.get(tag);
    if (!v) return null;
    return new TextDecoder('utf-8', { fatal: false })
      .decode(v)
      .replace(/\0/g, '')
      .trim();
  }

  /** First numeric value of a DS/IS multi-value string ("40\400" -> 40). */
  number(tag: number): number | null {
    const s = this.string(tag);
    if (!s) return null;
    const n = parseFloat(s.split('\\')[0].trim());
    return Number.isFinite(n) ? n : null;
  }

  uint16(tag: number): number | null {
    const v = this.raw.get(tag);
    if (!v || v.length < 2) return null;
    return new DataView(v.buffer, v.byteOffset, v.byteLength).getUint16(0, true);
  }
}

export interface DicomParseResult {
  dataset: DicomDataset;
  pixelDataSupported: boolean;
}

/** Returns null when the input is not a DICOM file. */
export function parseDicom(input: Uint8Array): DicomParseResult | null {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const ds = new DicomDataset();
  let offset = 0;
  let explicitVr = true;

  const hasPreamble =
    input.length > 132 &&
    input[128] === 0x44 && input[129] === 0x49 && input[130] === 0x43 && input[131] === 0x4d;

  if (hasPreamble) {
    offset = 132;
    const metaEnd = parseElements(input, view, offset, ds, true, true);
    if (metaEnd < 0) return null;
    offset = metaEnd;
    ds.transferSyntaxUid = ds.string(DicomTag.transferSyntax) ?? '1.2.840.10008.1.2.1';
    explicitVr = ds.transferSyntaxUid !== '1.2.840.10008.1.2';
  } else {
    if (input.length < 8) return null;
    const vr = String.fromCharCode(input[4], input[5]);
    explicitVr = KNOWN_VRS.has(vr);
    ds.transferSyntaxUid = explicitVr ? '1.2.840.10008.1.2.1' : '1.2.840.10008.1.2';
    const group = view.getUint16(0, true);
    if (![0x0002, 0x0008, 0x0010, 0x0018, 0x0020, 0x0028].includes(group)) return null;
  }

  const end = parseElements(input, view, offset, ds, explicitVr, false);
  if (end < 0 && ds.size === 0) return null;

  const supported =
    UNCOMPRESSED.has(ds.transferSyntaxUid) &&
    ds.has(DicomTag.pixelData) &&
    ds.has(DicomTag.rows) &&
    ds.has(DicomTag.columns);
  return { dataset: ds, pixelDataSupported: supported };
}

/** Parses elements from offset; returns the end offset or -1 on error. */
function parseElements(
  b: Uint8Array,
  view: DataView,
  offset: number,
  ds: DicomDataset,
  explicit: boolean,
  stopAfterGroup2: boolean,
): number {
  while (offset + 8 <= b.length) {
    const group = view.getUint16(offset, true);
    const elem = view.getUint16(offset + 2, true);
    if (stopAfterGroup2 && group !== 0x0002) return offset;
    const tag = (group << 16) | elem;
    offset += 4;

    let vr = '';
    let length: number;
    if (group === 0xfffe) {
      length = view.getUint32(offset, true);
      offset += 4;
    } else if (explicit) {
      vr = String.fromCharCode(b[offset], b[offset + 1]);
      if (LONG_VRS.has(vr)) {
        length = view.getUint32(offset + 4, true);
        offset += 8;
      } else {
        length = view.getUint16(offset + 2, true);
        offset += 4;
      }
    } else {
      length = view.getUint32(offset, true);
      offset += 4;
    }

    const undefinedLen = length === 0xffffffff;
    const isSequence = vr === 'SQ' || (undefinedLen && group !== 0xfffe);

    if (isSequence || (group === 0xfffe && elem === 0xe000 && undefinedLen)) {
      const next = skipSequence(b, view, offset, explicit, undefinedLen ? null : length);
      if (next < 0) return -1;
      offset = next;
      continue;
    }
    if (undefinedLen) return -1;
    if (offset + length > b.length) return -1;
    if (group !== 0xfffe) {
      ds.put(tag, b.subarray(offset, offset + length));
    }
    offset += length;
    if (tag === DicomTag.pixelData) return offset;
  }
  return offset;
}

/** Skips a sequence value (defined or undefined length); returns end offset. */
function skipSequence(
  b: Uint8Array,
  view: DataView,
  offset: number,
  explicit: boolean,
  definedLength: number | null,
): number {
  if (definedLength !== null) {
    const end = offset + definedLength;
    return end <= b.length ? end : -1;
  }
  while (offset + 8 <= b.length) {
    const group = view.getUint16(offset, true);
    const elem = view.getUint16(offset + 2, true);
    const length = view.getUint32(offset + 4, true);
    offset += 8;
    if (group === 0xfffe && elem === 0xe0dd) return offset;
    if (group === 0xfffe && elem === 0xe000) {
      if (length === 0xffffffff) {
        while (offset + 8 <= b.length) {
          const g = view.getUint16(offset, true);
          const e = view.getUint16(offset + 2, true);
          if (g === 0xfffe && e === 0xe00d) {
            offset += 8;
            break;
          }
          const next = skipSingleElement(b, view, offset, explicit);
          if (next < 0) return -1;
          offset = next;
        }
      } else {
        offset += length;
      }
      continue;
    }
    return -1;
  }
  return -1;
}

function skipSingleElement(b: Uint8Array, view: DataView, offset: number, explicit: boolean): number {
  if (offset + 8 > b.length) return -1;
  const group = view.getUint16(offset, true);
  offset += 4;
  let vr = '';
  let length: number;
  if (explicit && group !== 0xfffe) {
    vr = String.fromCharCode(b[offset], b[offset + 1]);
    if (LONG_VRS.has(vr)) {
      length = view.getUint32(offset + 4, true);
      offset += 8;
    } else {
      length = view.getUint16(offset + 2, true);
      offset += 4;
    }
  } else {
    length = view.getUint32(offset, true);
    offset += 4;
  }
  if (length === 0xffffffff || vr === 'SQ') {
    return skipSequence(b, view, offset, explicit, length === 0xffffffff ? null : length);
  }
  const end = offset + length;
  return end <= b.length ? end : -1;
}
