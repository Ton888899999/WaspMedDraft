'use client';

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { WindowPreset } from '@/lib/types';
import { DicomStudy } from '@/lib/dicom/study';
import { AttentionRegion } from '@/lib/dicom/analyze';
import { renderSliceToImageData } from '@/lib/dicom/render';

interface DicomSliceCanvasProps {
  study: DicomStudy;
  sliceIndex: number; // 0-based
  windowPreset: WindowPreset;
  isInverted: boolean;
  regions?: AttentionRegion[];
  showRegions?: boolean;
  className?: string;
}

const NO_REGIONS: AttentionRegion[] = [];

/** Draws a real DICOM slice with window/level applied to the raw pixel data.
    Memoized: parent hover-state re-renders must not redo the windowing pass. */
export const DicomSliceCanvas: React.FC<DicomSliceCanvasProps> = memo(function DicomSliceCanvas({
  study,
  sliceIndex,
  windowPreset,
  isInverted,
  regions = NO_REGIONS,
  showRegions = true,
  className,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slice = study.slices[Math.min(sliceIndex, study.slices.length - 1)];
  const sliceNumber = sliceIndex + 1;
  const activeRegions = useMemo(
    () =>
      showRegions ? regions.filter((r) => Math.abs(r.sliceNumber - sliceNumber) <= 2) : NO_REGIONS,
    [regions, showRegions, sliceNumber],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slice?.renderable) return;
    canvas.width = slice.columns;
    canvas.height = slice.rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = renderSliceToImageData(
      slice,
      windowPreset,
      isInverted,
      study.modality.toUpperCase() === 'CT',
    );
    ctx.putImageData(imageData, 0, 0);

    // Attention-region markers: dashed ellipse + crosshair + label,
    // drawn in image coordinates so they zoom together with the slice.
    for (const r of activeRegions) {
      const cx = (r.cx / 100) * slice.columns;
      const cy = (r.cy / 100) * slice.rows;
      const rx = (r.rx / 100) * slice.columns;
      const ry = (r.ry / 100) * slice.rows;
      const lw = Math.max(1.5, slice.columns / 320);

      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
      ctx.lineWidth = lw;
      ctx.setLineDash([6 * lw, 4 * lw]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.25, cy);
      ctx.lineTo(cx + rx * 0.25, cy);
      ctx.moveTo(cx, cy - ry * 0.25);
      ctx.lineTo(cx, cy + ry * 0.25);
      ctx.stroke();

      const fontPx = Math.max(11, Math.round(slice.columns / 42));
      ctx.font = `${fontPx}px ui-monospace, monospace`;
      const text = r.label;
      const tw = ctx.measureText(text).width;
      const tx = Math.min(Math.max(cx - tw / 2, 4), slice.columns - tw - 4);
      const ty = Math.max(cy - ry - fontPx * 0.7, fontPx + 4);
      ctx.fillStyle = 'rgba(11, 15, 23, 0.82)';
      ctx.fillRect(tx - 4, ty - fontPx, tw + 8, fontPx + 6);
      ctx.fillStyle = 'rgba(251, 191, 36, 1)';
      ctx.fillText(text, tx, ty);
      ctx.restore();
    }
  }, [slice, windowPreset, isInverted, study.modality, activeRegions]);

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
