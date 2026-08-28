'use client';

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { WindowPreset, ClinicalAnnotation } from '@/lib/types';
import { DicomStudy } from '@/lib/dicom/study';
import { renderSliceToImageData } from '@/lib/dicom/render';

interface DicomSliceCanvasProps {
  study: DicomStudy;
  sliceIndex: number; // 0-based
  windowPreset: WindowPreset;
  isInverted: boolean;
  totalSlices: number;
  /** AI-detected clinical annotations — placed at their precise anatomical locations */
  aiAnnotations?: ClinicalAnnotation[];
  showAnnotations?: boolean;
  className?: string;
}

const SEVERITY_COLORS: Record<ClinicalAnnotation['severity'], string> = {
  pathology: 'rgba(239, 68, 68, 0.95)',   // red
  warning:   'rgba(251, 191, 36, 0.95)',  // amber
  info:      'rgba(34, 211, 238, 0.85)',  // cyan
};
const SEVERITY_BG: Record<ClinicalAnnotation['severity'], string> = {
  pathology: 'rgba(127, 29, 29, 0.88)',
  warning:   'rgba(78, 44, 0, 0.88)',
  info:      'rgba(8, 60, 80, 0.88)',
};

const NO_ANNOTATIONS: ClinicalAnnotation[] = [];

/** Draws a real DICOM slice with window/level applied to the raw pixel data.
    Renders precise AI clinical annotations at their stated cx/cy positions.
    Memoized: parent hover-state re-renders must not redo the windowing pass. */
export const DicomSliceCanvas: React.FC<DicomSliceCanvasProps> = memo(function DicomSliceCanvas({
  study,
  sliceIndex,
  windowPreset,
  isInverted,
  totalSlices,
  aiAnnotations = NO_ANNOTATIONS,
  showAnnotations = true,
  className,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slice = study.slices[Math.min(sliceIndex, study.slices.length - 1)];
  const sliceNumber = sliceIndex + 1; // 1-based

  // Only show annotations that belong to this slice (±2 slices tolerance)
  const activeAnnotations = useMemo(() => {
    if (!showAnnotations || aiAnnotations.length === 0) return NO_ANNOTATIONS;
    return aiAnnotations.filter((ann) => {
      const targetSlice = Math.max(1, Math.round((ann.slicePercent / 100) * totalSlices));
      return Math.abs(targetSlice - sliceNumber) <= 2;
    });
  }, [aiAnnotations, showAnnotations, sliceNumber, totalSlices]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slice?.renderable) return;
    canvas.width = slice.columns;
    canvas.height = slice.rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render the DICOM pixel data with proper window/level
    const imageData = renderSliceToImageData(
      slice,
      windowPreset,
      isInverted,
      study.modality.toUpperCase() === 'CT',
    );
    ctx.putImageData(imageData, 0, 0);

    // Draw precise AI clinical annotation markers
    for (const ann of activeAnnotations) {
      const cx = (ann.cx / 100) * slice.columns;
      const cy = (ann.cy / 100) * slice.rows;

      // Ellipse size: small precise marker (not giant blob)
      const rx = Math.max(18, slice.columns * 0.06);
      const ry = Math.max(14, slice.rows * 0.05);
      const lw = Math.max(1.5, slice.columns / 300);
      const color = SEVERITY_COLORS[ann.severity];
      const bgColor = SEVERITY_BG[ann.severity];

      ctx.save();

      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * lw;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 1.5;
      ctx.setLineDash([5 * lw, 3 * lw]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      // Inner crosshair — precise point marker
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      const cs = rx * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - cs, cy); ctx.lineTo(cx + cs, cy);
      ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy + cs);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, lw * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Label badge (above the ellipse)
      const fontPx = Math.max(10, Math.round(slice.columns / 50));
      ctx.font = `bold ${fontPx}px ui-monospace, monospace`;
      const text = ann.label;
      const tw = ctx.measureText(text).width;
      const padding = fontPx * 0.5;
      const tx = Math.min(Math.max(cx - tw / 2, padding), slice.columns - tw - padding * 2);
      const ty = Math.max(cy - ry - fontPx * 0.4, fontPx + padding * 2);
      const bw = tw + padding * 2;
      const bh = fontPx + padding;
      const br = 4; // border radius

      // Rounded rect background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.moveTo(tx - padding + br, ty - fontPx - padding / 2);
      ctx.lineTo(tx - padding + bw - br, ty - fontPx - padding / 2);
      ctx.arcTo(tx - padding + bw, ty - fontPx - padding / 2, tx - padding + bw, ty + padding / 2, br);
      ctx.lineTo(tx - padding + bw, ty + padding / 2 - br);
      ctx.arcTo(tx - padding + bw, ty + padding / 2, tx - padding + bw - br, ty + padding / 2, br);
      ctx.lineTo(tx - padding + br, ty + padding / 2);
      ctx.arcTo(tx - padding, ty + padding / 2, tx - padding, ty + padding / 2 - br, br);
      ctx.lineTo(tx - padding, ty - fontPx - padding / 2 + br);
      ctx.arcTo(tx - padding, ty - fontPx - padding / 2, tx - padding + br, ty - fontPx - padding / 2, br);
      ctx.closePath();
      ctx.fill();

      // Badge border
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 0.8;
      ctx.stroke();

      // Label text
      ctx.fillStyle = color;
      ctx.fillText(text, tx, ty);

      ctx.restore();
    }
  }, [slice, windowPreset, isInverted, study.modality, activeAnnotations]);

  if (!slice) return null;

  if (!slice.renderable) {
    return (
      <div className="flex items-center justify-center h-full text-center text-[#94A3B8] text-xs font-mono px-6 leading-relaxed">
        Срез {slice.fileName} в сжатом формате передачи —<br />
        просмотр недоступен, метаданные обработаны
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'max-w-full max-h-full object-contain'}
      style={{ imageRendering: 'auto' }}
    />
  );
});
