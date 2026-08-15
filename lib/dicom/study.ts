import type JSZipType from 'jszip';
import { DicomTag, parseDicom } from './parser';

/** One parsed DICOM slice, ready for windowed rendering. */
export interface DicomSlice {
  fileName: string;
  rows: number;
  columns: number;
  bitsAllocated: number;
  samplesPerPixel: number;
  signed: boolean;
  monochrome1: boolean;
  rescaleSlope: number;
  rescaleIntercept: number;
  windowCenter: number;
  windowWidth: number;
  instanceNumber: number;
  sliceLocation: number;
  pixelBytes: Uint8Array;
  renderable: boolean;
}

export interface DicomStudy {
  patientName: string;
  patientId: string;
  patientAgeSex: string;
  studyDate: string;
  studyTime: string;
  modality: string;
  description: string;
  institution: string;
  deviceModel: string;
  bodyPart: string;
  sliceThickness: string;
  slices: DicomSlice[];
  skippedFiles: number;
}

export class StudyLoadError extends Error {}

/** Extracts a ZIP archive in the browser and parses every DICOM file inside. */
export async function loadStudyFromZip(file: File): Promise<DicomStudy> {
  // jszip is loaded on demand so it stays out of the initial page bundle.
  const { default: JSZip } = await import('jszip');
  let zip: JSZipType;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new StudyLoadError('Файл не является корректным ZIP-архивом.');
  }

  const slices: DicomSlice[] = [];
  let meta: ReturnType<typeof parseDicom> = null;
  let skipped = 0;

  const entries = Object.values(zip.files).filter((e) => {
    if (e.dir) return false;
    const base = e.name.split('/').pop() ?? '';
    return !e.name.includes('__MACOSX') && !base.startsWith('.');
  });

  for (const entry of entries) {
    const bytes = await entry.async('uint8array');
    const parsed = parseDicom(bytes);
    if (!parsed) {
      skipped++;
      continue;
    }
    meta ??= parsed;
    const ds = parsed.dataset;
    const rows = ds.uint16(DicomTag.rows) ?? 0;
    const cols = ds.uint16(DicomTag.columns) ?? 0;
    const pixels = ds.bytes(DicomTag.pixelData) ?? new Uint8Array(0);

    slices.push({
      fileName: entry.name.split('/').pop() ?? entry.name,
      rows,
      columns: cols,
      bitsAllocated: ds.uint16(DicomTag.bitsAllocated) ?? 16,
      samplesPerPixel: ds.uint16(DicomTag.samplesPerPixel) ?? 1,
      signed: (ds.uint16(DicomTag.pixelRepresentation) ?? 0) === 1,
      monochrome1: (ds.string(DicomTag.photometric) ?? '').toUpperCase() === 'MONOCHROME1',
      rescaleSlope: ds.number(DicomTag.rescaleSlope) ?? 1,
      rescaleIntercept: ds.number(DicomTag.rescaleIntercept) ?? 0,
      windowCenter: ds.number(DicomTag.windowCenter) ?? 0,
      windowWidth: ds.number(DicomTag.windowWidth) ?? 0,
      instanceNumber: ds.number(DicomTag.instanceNumber) ?? 0,
      sliceLocation: ds.number(DicomTag.sliceLocation) ?? 0,
      pixelBytes: pixels,
      renderable: parsed.pixelDataSupported && rows > 0 && cols > 0 && pixels.length > 0,
    });
  }

  if (slices.length === 0) {
    throw new StudyLoadError(
      'В архиве не найдено DICOM-файлов. Проверьте, что ZIP содержит файлы исследования (.dcm).',
    );
  }

  slices.sort(
    (a, b) =>
      a.instanceNumber - b.instanceNumber ||
      a.sliceLocation - b.sliceLocation ||
      a.fileName.localeCompare(b.fileName),
  );

  const m = meta!.dataset;
  const sex = m.string(DicomTag.patientSex) ?? '';
  const age = m.string(DicomTag.patientAge) ?? '';
  const thickness = m.number(DicomTag.sliceThickness);

  return {
    patientName: cleanName(m.string(DicomTag.patientName)) ?? 'Анонимизированный пациент',
    patientId: m.string(DicomTag.patientId) || '—',
    patientAgeSex:
      [age && cleanAge(age), sex].filter(Boolean).join(' / ') || '—',
    studyDate: formatDate(m.string(DicomTag.studyDate)),
    studyTime: formatTime(m.string(DicomTag.studyTime)),
    modality: m.string(DicomTag.modality) || 'OT',
    description:
      m.string(DicomTag.studyDescription) ||
      m.string(DicomTag.seriesDescription) ||
      'DICOM-исследование',
    institution: m.string(DicomTag.institutionName) || 'Отделение лучевой диагностики',
    deviceModel: m.string(DicomTag.manufacturerModel) || 'DICOM 3.0 Compatible',
    bodyPart: m.string(DicomTag.bodyPart) || '—',
    sliceThickness: thickness != null ? `${trimZero(thickness)} mm` : '—',
    slices,
    skippedFiles: skipped,
  };
}

function cleanName(pn: string | null): string | null {
  if (!pn?.trim()) return null;
  return pn.replace(/\^/g, ' ').trim();
}

function cleanAge(age: string): string {
  const m = age.trim().match(/^0*(\d+)([DWMY])?$/);
  if (!m) return age;
  const n = m[1];
  switch (m[2]) {
    case 'Y': return `${n} лет`;
    case 'M': return `${n} мес.`;
    case 'W': return `${n} нед.`;
    case 'D': return `${n} дн.`;
    default: return n;
  }
}

function formatDate(da: string | null): string {
  if (!da || da.length !== 8) return '—';
  return `${da.slice(6, 8)}.${da.slice(4, 6)}.${da.slice(0, 4)}`;
}

function formatTime(tm: string | null): string {
  if (!tm || tm.length < 4) return '—';
  return `${tm.slice(0, 2)}:${tm.slice(2, 4)}`;
}

function trimZero(v: number): string {
  return v === Math.round(v) ? String(Math.round(v)) : v.toFixed(1);
}
