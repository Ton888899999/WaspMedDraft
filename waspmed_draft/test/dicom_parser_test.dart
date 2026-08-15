import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:waspmed_draft/dicom/dicom_parser.dart';
import 'package:waspmed_draft/dicom/study.dart';

/// Builds a minimal explicit-VR little-endian DICOM file in memory.
Uint8List buildSyntheticDicom({required int instanceNumber, int size = 8}) {
  final out = BytesBuilder();

  void tag(int group, int elem) {
    out.add(Uint8List(2)..buffer.asByteData().setUint16(0, group, Endian.little));
    out.add(Uint8List(2)..buffer.asByteData().setUint16(0, elem, Endian.little));
  }

  void shortElement(int group, int elem, String vr, List<int> value) {
    tag(group, elem);
    out.add(ascii.encode(vr));
    out.add(Uint8List(2)..buffer.asByteData().setUint16(0, value.length, Endian.little));
    out.add(value);
  }

  void strElement(int group, int elem, String vr, String value) {
    var v = value;
    if (v.length.isOdd) v += vr == 'UI' ? '\x00' : ' ';
    shortElement(group, elem, vr, ascii.encode(v));
  }

  void us(int group, int elem, int value) {
    shortElement(group, elem, 'US',
        Uint8List(2)..buffer.asByteData().setUint16(0, value, Endian.little));
  }

  // Preamble + magic
  out.add(Uint8List(128));
  out.add(ascii.encode('DICM'));

  // File meta group (0002)
  strElement(0x0002, 0x0010, 'UI', '1.2.840.10008.1.2.1');

  // Main dataset
  strElement(0x0008, 0x0020, 'DA', '20260815');
  strElement(0x0008, 0x0030, 'TM', '104500');
  strElement(0x0008, 0x0060, 'CS', 'MR');
  strElement(0x0008, 0x1030, 'LO', 'MRI Lumbar Spine');
  strElement(0x0010, 0x0010, 'PN', 'Test^Patient');
  strElement(0x0010, 0x0020, 'LO', 'PID-001');
  strElement(0x0010, 0x0040, 'CS', 'M');
  strElement(0x0010, 0x1010, 'AS', '045Y');
  strElement(0x0018, 0x0050, 'DS', '4.0');
  strElement(0x0020, 0x0013, 'IS', '$instanceNumber');
  us(0x0028, 0x0002, 1);
  strElement(0x0028, 0x0004, 'CS', 'MONOCHROME2');
  us(0x0028, 0x0010, size); // rows
  us(0x0028, 0x0011, size); // cols
  us(0x0028, 0x0100, 16); // bits allocated
  us(0x0028, 0x0103, 0); // unsigned
  strElement(0x0028, 0x1050, 'DS', '128');
  strElement(0x0028, 0x1051, 'DS', '256');

  // Pixel data: OW with a gradient
  final pixels = Uint8List(size * size * 2);
  final bd = ByteData.sublistView(pixels);
  for (var i = 0; i < size * size; i++) {
    bd.setUint16(i * 2, i * 4, Endian.little);
  }
  tag(0x7FE0, 0x0010);
  out.add(ascii.encode('OW'));
  out.add(Uint8List(2)); // reserved
  out.add(Uint8List(4)..buffer.asByteData().setUint32(0, pixels.length, Endian.little));
  out.add(pixels);

  return out.toBytes();
}

void main() {
  test('parses a synthetic explicit-VR DICOM file', () {
    final bytes = buildSyntheticDicom(instanceNumber: 3);
    final result = DicomParser.parse(bytes);
    expect(result, isNotNull);
    final ds = result!.dataset;
    expect(result.pixelDataSupported, isTrue);
    expect(ds.string(DicomTag.modality), 'MR');
    expect(ds.string(DicomTag.patientId), 'PID-001');
    expect(ds.uint16(DicomTag.rows), 8);
    expect(ds.number(DicomTag.windowCenter), 128);
    expect(ds.bytes(DicomTag.pixelData)!.length, 8 * 8 * 2);
  });

  test('rejects a non-DICOM file', () {
    expect(DicomParser.parse(Uint8List.fromList(utf8.encode('hello world, not dicom'))), isNull);
  });

  test('loads a study from a ZIP and sorts slices by instance number', () {
    final archive = Archive();
    for (final n in [2, 1, 3]) {
      final dcm = buildSyntheticDicom(instanceNumber: n);
      archive.addFile(ArchiveFile('series/slice_$n.dcm', dcm.length, dcm));
    }
    archive.addFile(ArchiveFile('readme.txt', 5, ascii.encode('hello')));
    final zip = Uint8List.fromList(ZipEncoder().encode(archive));

    final study = loadStudyFromZipBytes(zip);
    expect(study.slices.length, 3);
    expect(study.slices.map((s) => s.instanceNumber).toList(), [1, 2, 3]);
    expect(study.patientName, 'Test Patient');
    expect(study.patientAgeSex, contains('45 лет'));
    expect(study.modality, 'MR');
    expect(study.studyDate, '15.08.2026');
    expect(study.sliceThickness, '4 mm');
    expect(study.skippedFiles, 1); // readme.txt
    expect(study.slices.first.renderable, isTrue);
  });

  test('throws a clear error for a ZIP without DICOM files', () {
    final archive = Archive()
      ..addFile(ArchiveFile('a.txt', 4, ascii.encode('test')));
    final zip = Uint8List.fromList(ZipEncoder().encode(archive));
    expect(() => loadStudyFromZipBytes(zip), throwsA(isA<StudyLoadException>()));
  });
}
