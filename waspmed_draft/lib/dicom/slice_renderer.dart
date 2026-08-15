import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'study.dart';

/// Window/level presets. Center/width are in output units
/// (HU for CT after rescale). null => use the values stored in the file.
class WindowPreset {
  final String id;
  final String label;
  final double? center;
  final double? width;
  const WindowPreset(this.id, this.label, this.center, this.width);

  static const auto = WindowPreset('auto', 'Авто', null, null);
  static const softTissue = WindowPreset('soft', 'Мягкие ткани', 40, 400);
  static const bone = WindowPreset('bone', 'Кость', 300, 1500);
  static const lung = WindowPreset('lung', 'Лёгкие', -600, 1500);
  static const brain = WindowPreset('brain', 'Мозг', 40, 80);

  static const all = [auto, softTissue, bone, lung, brain];
}

/// Converts a slice's raw pixel data into a displayable image,
/// applying rescale, windowing and optional inversion.
Future<ui.Image> renderSlice(DicomSlice s, WindowPreset preset, bool invert) {
  final w = s.columns, h = s.rows;
  final out = Uint8List(w * h * 4);

  if (s.samplesPerPixel == 3 && s.bitsAllocated == 8) {
    // Interleaved RGB.
    final n = w * h;
    for (var i = 0; i < n; i++) {
      final r = s.pixelBytes[i * 3];
      final g = s.pixelBytes[i * 3 + 1];
      final b = s.pixelBytes[i * 3 + 2];
      out[i * 4] = invert ? 255 - r : r;
      out[i * 4 + 1] = invert ? 255 - g : g;
      out[i * 4 + 2] = invert ? 255 - b : b;
      out[i * 4 + 3] = 255;
    }
  } else {
    final values = _grayValues(s);
    var center = preset.center ?? s.windowCenter;
    var width = preset.width ?? s.windowWidth;
    if (width <= 0) {
      // No usable window in the file: stretch to the actual value range.
      var min = double.infinity, max = double.negativeInfinity;
      for (final v in values) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      center = (min + max) / 2;
      width = (max - min).clamp(1, double.infinity).toDouble();
    }
    final low = center - width / 2;
    final flip = invert != s.monochrome1;
    for (var i = 0; i < values.length; i++) {
      var g = ((values[i] - low) / width * 255).clamp(0, 255).toInt();
      if (flip) g = 255 - g;
      out[i * 4] = g;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = g;
      out[i * 4 + 3] = 255;
    }
  }

  final completer = Completer<ui.Image>();
  ui.decodeImageFromPixels(out, w, h, ui.PixelFormat.rgba8888, completer.complete);
  return completer.future;
}

Float32List _grayValues(DicomSlice s) {
  final n = s.rows * s.columns;
  final result = Float32List(n);
  if (s.bitsAllocated == 8) {
    for (var i = 0; i < n && i < s.pixelBytes.length; i++) {
      result[i] = s.pixelBytes[i] * s.rescaleSlope + s.rescaleIntercept;
    }
  } else {
    final data = ByteData.sublistView(s.pixelBytes);
    final count = s.pixelBytes.length ~/ 2;
    for (var i = 0; i < n && i < count; i++) {
      final raw = s.signed
          ? data.getInt16(i * 2, Endian.little)
          : data.getUint16(i * 2, Endian.little);
      result[i] = raw * s.rescaleSlope + s.rescaleIntercept;
    }
  }
  return result;
}
