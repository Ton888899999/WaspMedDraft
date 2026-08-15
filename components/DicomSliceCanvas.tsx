'use client';

import React, { useEffect, useRef } from 'react';
import { WindowPreset } from '@/lib/types';
import { DicomStudy } from '@/lib/dicom/study';
import { renderSliceToImageData } from '@/lib/dicom/render';

interface DicomSliceCanvasProps {
  study: DicomStudy;
  sliceIndex: number; // 0-based
  windowPreset: WindowPreset;
  isInverted: boolean;
}

/** Draws a real DICOM slice with window/level applied to the raw pixel data. */
export const DicomSliceCanvas: React.FC<DicomSliceCanvasProps> = ({
  study,
  sliceIndex,
  windowPreset,
  isInverted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slice = study.slices[Math.min(sliceIndex, study.slices.length - 1)];

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
  }, [slice, windowPreset, isInverted, study.modality]);

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
      className="max-w-full max-h-full object-contain"
      style={{ imageRendering: 'auto' }}
    />
  );
};
