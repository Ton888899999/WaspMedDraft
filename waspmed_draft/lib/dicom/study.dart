import 'package:archive/archive.dart';
import 'package:flutter/foundation.dart';

import 'dicom_parser.dart';

/// One parsed DICOM slice, ready for windowed rendering.
class DicomSlice {
  final String fileName;
  final int rows;
  final int columns;
  final int bitsAllocated;
  final int samplesPerPixel;
  final bool signed;
  final bool monochrome1;
  final double rescaleSlope;
  final double rescaleIntercept;
  final double windowCenter;
  final double windowWidth;
  final int instanceNumber;
  final double sliceLocation;
  final Uint8List pixelBytes;
  final bool renderable;

  DicomSlice({
    required this.fileName,
    required this.rows,
    required this.columns,
    required this.bitsAllocated,
    required this.samplesPerPixel,
    required this.signed,
    required this.monochrome1,
    required this.rescaleSlope,
    required this.rescaleIntercept,
    required this.windowCenter,
    required this.windowWidth,
    required this.instanceNumber,
    required this.sliceLocation,
    required this.pixelBytes,
    required this.renderable,
  });
}

class DicomStudy {
  final String patientName;
  final String patientId;
  final String patientAgeSex;
  final String studyDate;
  final String studyTime;
  final String modality;
  final String description;
  final String institution;
  final String deviceModel;
  final String bodyPart;
  final String sliceThickness;
  final List<DicomSlice> slices;
  final int skippedFiles;

  DicomStudy({
    required this.patientName,
    required this.patientId,
    required this.patientAgeSex,
    required this.studyDate,
    required this.studyTime,
    required this.modality,
    required this.description,
    required this.institution,
    required this.deviceModel,
    required this.bodyPart,
    required this.sliceThickness,
    required this.slices,
    required this.skippedFiles,
  });
}

class StudyLoadException implements Exception {
  final String message;
  StudyLoadException(this.message);
  @override
  String toString() => message;
}

/// Extracts a ZIP archive and parses every DICOM file inside.
/// Heavy work — call through [compute].
DicomStudy loadStudyFromZipBytes(Uint8List zipBytes) {
  Archive archive;
  try {
    archive = ZipDecoder().decodeBytes(zipBytes);
  } catch (_) {
    throw StudyLoadException('Файл не является корректным ZIP-архивом.');
  }

  final slices = <DicomSlice>[];
  DicomDataset? meta;
  var skipped = 0;

  for (final entry in archive) {
    if (!entry.isFile) continue;
    final name = entry.name;
    final base = name.split('/').last;
    if (name.contains('__MACOSX') || base.startsWith('.')) continue;

    final Uint8List bytes = entry.content;
    final parsed = DicomParser.parse(bytes);
    if (parsed == null) {
      skipped++;
      continue;
    }
    final ds = parsed.dataset;
    meta ??= ds;

    final rows = ds.uint16(DicomTag.rows) ?? 0;
    final cols = ds.uint16(DicomTag.columns) ?? 0;
    final pixels = ds.bytes(DicomTag.pixelData) ?? Uint8List(0);
    final defaultCenter = ds.number(DicomTag.windowCenter);
    final defaultWidth = ds.number(DicomTag.windowWidth);

    slices.add(DicomSlice(
      fileName: base,
      rows: rows,
      columns: cols,
      bitsAllocated: ds.uint16(DicomTag.bitsAllocated) ?? 16,
      samplesPerPixel: ds.uint16(DicomTag.samplesPerPixel) ?? 1,
      signed: (ds.uint16(DicomTag.pixelRepresentation) ?? 0) == 1,
      monochrome1: (ds.string(DicomTag.photometric) ?? '').toUpperCase() == 'MONOCHROME1',
      rescaleSlope: ds.number(DicomTag.rescaleSlope) ?? 1,
      rescaleIntercept: ds.number(DicomTag.rescaleIntercept) ?? 0,
      windowCenter: defaultCenter ?? 0,
      windowWidth: defaultWidth ?? 0,
      instanceNumber: ds.number(DicomTag.instanceNumber)?.toInt() ?? 0,
      sliceLocation: ds.number(DicomTag.sliceLocation) ?? 0,
      pixelBytes: pixels,
      renderable: parsed.pixelDataSupported && rows > 0 && cols > 0 && pixels.isNotEmpty,
    ));
  }

  if (slices.isEmpty) {
    throw StudyLoadException(
        'В архиве не найдено DICOM-файлов. Проверьте, что ZIP содержит файлы исследования (.dcm).');
  }

  slices.sort((a, b) {
    if (a.instanceNumber != b.instanceNumber) {
      return a.instanceNumber.compareTo(b.instanceNumber);
    }
    if (a.sliceLocation != b.sliceLocation) {
      return a.sliceLocation.compareTo(b.sliceLocation);
    }
    return a.fileName.compareTo(b.fileName);
  });

  final m = meta!;
  final sex = m.string(DicomTag.patientSex) ?? '';
  final age = m.string(DicomTag.patientAge) ?? '';
  final thickness = m.number(DicomTag.sliceThickness);

  return DicomStudy(
    patientName: _cleanName(m.string(DicomTag.patientName)) ?? 'Анонимизированный пациент',
    patientId: m.string(DicomTag.patientId) ?? '—',
    patientAgeSex: [if (age.isNotEmpty) _cleanAge(age), if (sex.isNotEmpty) sex].join(' / ').ifEmpty('—'),
    studyDate: _formatDate(m.string(DicomTag.studyDate)),
    studyTime: _formatTime(m.string(DicomTag.studyTime)),
    modality: m.string(DicomTag.modality) ?? 'OT',
    description: m.string(DicomTag.studyDescription) ??
        m.string(DicomTag.seriesDescription) ??
        'DICOM-исследование',
    institution: m.string(DicomTag.institutionName) ?? 'Отделение лучевой диагностики',
    deviceModel: m.string(DicomTag.manufacturerModel) ?? 'DICOM 3.0 Compatible',
    bodyPart: m.string(DicomTag.bodyPart) ?? '—',
    sliceThickness: thickness != null ? '${_trimZero(thickness)} mm' : '—',
    slices: slices,
    skippedFiles: skipped,
  );
}

String? _cleanName(String? pn) {
  if (pn == null || pn.trim().isEmpty) return null;
  return pn.replaceAll('^', ' ').trim();
}

String _cleanAge(String age) {
  // "045Y" -> "45 лет"
  final match = RegExp(r'^0*(\d+)([DWMY])?$').firstMatch(age.trim());
  if (match == null) return age;
  final n = match.group(1)!;
  switch (match.group(2)) {
    case 'Y':
      return '$n лет';
    case 'M':
      return '$n мес.';
    case 'W':
      return '$n нед.';
    case 'D':
      return '$n дн.';
    default:
      return n;
  }
}

String _formatDate(String? da) {
  if (da == null || da.length != 8) return '—';
  return '${da.substring(6, 8)}.${da.substring(4, 6)}.${da.substring(0, 4)}';
}

String _formatTime(String? tm) {
  if (tm == null || tm.length < 4) return '—';
  return '${tm.substring(0, 2)}:${tm.substring(2, 4)}';
}

String _trimZero(double v) {
  return v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1);
}

extension on String {
  String ifEmpty(String fallback) => isEmpty ? fallback : this;
}
