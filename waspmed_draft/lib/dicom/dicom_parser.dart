import 'dart:convert';
import 'dart:typed_data';

/// Minimal DICOM parser: little-endian explicit/implicit VR, uncompressed
/// pixel data (MONOCHROME1/2, RGB). Compressed transfer syntaxes are parsed
/// for metadata only — the slice is then marked as unsupported for rendering.
class DicomTag {
  static const int transferSyntax = 0x00020010;
  static const int patientName = 0x00100010;
  static const int patientId = 0x00100020;
  static const int patientSex = 0x00100040;
  static const int patientAge = 0x00101010;
  static const int studyDate = 0x00080020;
  static const int studyTime = 0x00080030;
  static const int modality = 0x00080060;
  static const int studyDescription = 0x00081030;
  static const int seriesDescription = 0x0008103E;
  static const int institutionName = 0x00080080;
  static const int manufacturerModel = 0x00081090;
  static const int bodyPart = 0x00180015;
  static const int sliceThickness = 0x00180050;
  static const int kvp = 0x00180060;
  static const int instanceNumber = 0x00200013;
  static const int sliceLocation = 0x00201041;
  static const int samplesPerPixel = 0x00280002;
  static const int photometric = 0x00280004;
  static const int rows = 0x00280010;
  static const int columns = 0x00280011;
  static const int bitsAllocated = 0x00280100;
  static const int bitsStored = 0x00280101;
  static const int pixelRepresentation = 0x00280103;
  static const int windowCenter = 0x00281050;
  static const int windowWidth = 0x00281051;
  static const int rescaleIntercept = 0x00281052;
  static const int rescaleSlope = 0x00281053;
  static const int pixelData = 0x7FE00010;
}

class DicomDataset {
  final Map<int, Uint8List> _raw = {};
  String transferSyntaxUid = '1.2.840.10008.1.2.1';

  bool has(int tag) => _raw.containsKey(tag);

  Uint8List? bytes(int tag) => _raw[tag];

  void put(int tag, Uint8List value) => _raw[tag] = value;

  String? string(int tag) {
    final v = _raw[tag];
    if (v == null) return null;
    try {
      return utf8.decode(v, allowMalformed: true).trim().replaceAll('\x00', '');
    } catch (_) {
      return null;
    }
  }

  /// First numeric value of a DS/IS multi-value string ("40\400" -> 40).
  double? number(int tag) {
    final s = string(tag);
    if (s == null || s.isEmpty) return null;
    return double.tryParse(s.split('\\').first.trim());
  }

  int? uint16(int tag) {
    final v = _raw[tag];
    if (v == null || v.length < 2) return null;
    return ByteData.sublistView(v).getUint16(0, Endian.little);
  }
}

class DicomParseResult {
  final DicomDataset dataset;
  final bool pixelDataSupported;
  DicomParseResult(this.dataset, this.pixelDataSupported);
}

class DicomParser {
  static const _uncompressed = {
    '1.2.840.10008.1.2', // implicit VR LE
    '1.2.840.10008.1.2.1', // explicit VR LE
  };

  /// Returns null when [input] is not a DICOM file.
  static DicomParseResult? parse(Uint8List input) {
    var offset = 0;
    var explicitVr = true;
    final ds = DicomDataset();

    final hasPreamble = input.length > 132 &&
        input[128] == 0x44 && // D
        input[129] == 0x49 && // I
        input[130] == 0x43 && // C
        input[131] == 0x4D; // M

    if (hasPreamble) {
      offset = 132;
      // File meta group (0002) is always explicit VR little endian.
      final metaEnd = _parseElements(input, offset, ds, explicit: true, stopAfterGroup2: true);
      if (metaEnd < 0) return null;
      offset = metaEnd;
      ds.transferSyntaxUid = ds.string(DicomTag.transferSyntax) ?? '1.2.840.10008.1.2.1';
      explicitVr = ds.transferSyntaxUid != '1.2.840.10008.1.2';
    } else {
      // No preamble: guess VR mode from the first element's VR bytes.
      if (input.length < 8) return null;
      final vr = ascii.decode(input.sublist(4, 6), allowInvalid: true);
      explicitVr = _knownVrs.contains(vr);
      ds.transferSyntaxUid =
          explicitVr ? '1.2.840.10008.1.2.1' : '1.2.840.10008.1.2';
      // Sanity check: the first tag must have a plausible group number.
      final group = ByteData.sublistView(input).getUint16(0, Endian.little);
      if (group != 0x0002 && group != 0x0008 && group != 0x0010 && group != 0x0018 && group != 0x0020 && group != 0x0028) {
        return null;
      }
    }

    final end = _parseElements(input, offset, ds, explicit: explicitVr);
    if (end < 0 && ds._raw.isEmpty) return null;

    final supported = _uncompressed.contains(ds.transferSyntaxUid) &&
        ds.has(DicomTag.pixelData) &&
        ds.has(DicomTag.rows) &&
        ds.has(DicomTag.columns);
    return DicomParseResult(ds, supported);
  }

  static const _knownVrs = {
    'AE', 'AS', 'AT', 'CS', 'DA', 'DS', 'DT', 'FL', 'FD', 'IS', 'LO', 'LT',
    'OB', 'OD', 'OF', 'OL', 'OW', 'PN', 'SH', 'SL', 'SQ', 'SS', 'ST', 'TM',
    'UC', 'UI', 'UL', 'UN', 'UR', 'US', 'UT',
  };

  static const _longLengthVrs = {'OB', 'OD', 'OF', 'OL', 'OW', 'SQ', 'UC', 'UN', 'UR', 'UT'};

  /// Parses elements from [offset]; returns the end offset or -1 on error.
  static int _parseElements(Uint8List b, int offset, DicomDataset ds,
      {required bool explicit, bool stopAfterGroup2 = false}) {
    final view = ByteData.sublistView(b);
    while (offset + 8 <= b.length) {
      final group = view.getUint16(offset, Endian.little);
      final elem = view.getUint16(offset + 2, Endian.little);
      if (stopAfterGroup2 && group != 0x0002) return offset;
      final tag = (group << 16) | elem;
      offset += 4;

      String vr = '';
      int length;
      if (group == 0xFFFE) {
        // Item / delimiter tags carry no VR.
        length = view.getUint32(offset, Endian.little);
        offset += 4;
      } else if (explicit) {
        vr = ascii.decode(b.sublist(offset, offset + 2), allowInvalid: true);
        if (_longLengthVrs.contains(vr)) {
          length = view.getUint32(offset + 4, Endian.little);
          offset += 8;
        } else {
          length = view.getUint16(offset + 2, Endian.little);
          offset += 4;
        }
      } else {
        length = view.getUint32(offset, Endian.little);
        offset += 4;
      }

      final undefined = length == 0xFFFFFFFF;
      final isSequence = vr == 'SQ' || (undefined && group != 0xFFFE);

      if (isSequence || (group == 0xFFFE && elem == 0xE000 && undefined)) {
        final next = _skipSequence(b, offset, explicit: explicit, definedLength: undefined ? null : length);
        if (next < 0) return -1;
        offset = next;
        continue;
      }
      if (undefined) return -1; // undefined length on a non-sequence element
      if (offset + length > b.length) {
        // Truncated file: keep what we have.
        return -1;
      }
      if (group != 0xFFFE) {
        ds.put(tag, Uint8List.sublistView(b, offset, offset + length));
      }
      offset += length;
      if (tag == DicomTag.pixelData) return offset; // nothing useful after
    }
    return offset;
  }

  /// Skips a sequence value (defined or undefined length); returns end offset.
  static int _skipSequence(Uint8List b, int offset, {required bool explicit, int? definedLength}) {
    if (definedLength != null) {
      final end = offset + definedLength;
      return end <= b.length ? end : -1;
    }
    final view = ByteData.sublistView(b);
    while (offset + 8 <= b.length) {
      final group = view.getUint16(offset, Endian.little);
      final elem = view.getUint16(offset + 2, Endian.little);
      final length = view.getUint32(offset + 4, Endian.little);
      offset += 8;
      if (group == 0xFFFE && elem == 0xE0DD) return offset; // sequence end
      if (group == 0xFFFE && elem == 0xE000) {
        if (length == 0xFFFFFFFF) {
          // Undefined-length item: parse elements into a throwaway dataset
          // until the item delimiter.
          while (offset + 8 <= b.length) {
            final g = view.getUint16(offset, Endian.little);
            final e = view.getUint16(offset + 2, Endian.little);
            if (g == 0xFFFE && e == 0xE00D) {
              offset += 8;
              break;
            }
            final throwaway = DicomDataset();
            final next = _parseSingleElement(b, offset, throwaway, explicit: explicit);
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

  static int _parseSingleElement(Uint8List b, int offset, DicomDataset ds, {required bool explicit}) {
    final view = ByteData.sublistView(b);
    if (offset + 8 > b.length) return -1;
    final group = view.getUint16(offset, Endian.little);
    offset += 4;
    String vr = '';
    int length;
    if (explicit && group != 0xFFFE) {
      vr = ascii.decode(b.sublist(offset, offset + 2), allowInvalid: true);
      if (_longLengthVrs.contains(vr)) {
        length = view.getUint32(offset + 4, Endian.little);
        offset += 8;
      } else {
        length = view.getUint16(offset + 2, Endian.little);
        offset += 4;
      }
    } else {
      length = view.getUint32(offset, Endian.little);
      offset += 4;
    }
    if (length == 0xFFFFFFFF || vr == 'SQ') {
      return _skipSequence(b, offset, explicit: explicit, definedLength: length == 0xFFFFFFFF ? null : length);
    }
    final end = offset + length;
    return end <= b.length ? end : -1;
  }
}
