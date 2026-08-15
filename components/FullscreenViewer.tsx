'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Contrast,
  Play,
  Pause,
  Eye,
  EyeOff,
  Crosshair,
} from 'lucide-react';
import { WindowPreset } from '@/lib/types';
import { DicomStudy } from '@/lib/dicom/study';
import { AttentionRegion } from '@/lib/dicom/analyze';
import { DicomSliceCanvas } from '@/components/DicomSliceCanvas';

interface FullscreenViewerProps {
  study: DicomStudy;
  caseTitle: string;
  currentSlice: number; // 1-based
  onSliceChange: (slice: number) => void;
  windowPreset: WindowPreset;
  onWindowPresetChange: (preset: WindowPreset) => void;
  isInverted: boolean;
  onToggleInvert: () => void;
  regions: AttentionRegion[];
  onClose: () => void;
}

const PRESET_LABELS: { id: WindowPreset; label: string }[] = [
  { id: 'soft_tissue', label: 'SOFT' },
  { id: 'bone', label: 'BONE' },
  { id: 'lung', label: 'LUNG' },
  { id: 'brain', label: 'BRAIN' },
];

/**
 * Professional fullscreen reading mode:
 * wheel — slice scroll · Ctrl/⌘+wheel — zoom · drag — pan ·
 * double click — reset view · ←/→ — slices · Esc — exit.
 */
export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  study,
  caseTitle,
  currentSlice,
  onSliceChange,
  windowPreset,
  onWindowPresetChange,
  isInverted,
  onToggleInvert,
  regions,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showRegions, setShowRegions] = useState(true);
  const [isCine, setIsCine] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const totalSlices = study.slices.length;
  const slice = study.slices[Math.max(0, currentSlice - 1)];
  const regionsOnSlice = regions.filter((r) => Math.abs(r.sliceNumber - currentSlice) <= 2);

  const clampSlice = useCallback(
    (v: number) => Math.min(totalSlices, Math.max(1, v)),
    [totalSlices],
  );

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard: arrows, +/-, space (cine), 0 (reset), Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          onSliceChange(clampSlice(currentSlice + 1));
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          onSliceChange(clampSlice(currentSlice - 1));
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(10, z * 1.25));
          break;
        case '-':
          setZoom((z) => Math.max(0.25, z / 1.25));
          break;
        case '0':
          resetView();
          break;
        case ' ':
          e.preventDefault();
          setIsCine((c) => !c);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentSlice, clampSlice, onClose, onSliceChange]);

  // Cine loop.
  useEffect(() => {
    if (!isCine) return;
    const id = setInterval(() => {
      onSliceChange(currentSlice >= totalSlices ? 1 : currentSlice + 1);
    }, 90);
    return () => clearInterval(id);
  }, [isCine, currentSlice, totalSlices, onSliceChange]);

  // Block body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setZoom((z) => Math.min(10, Math.max(0.25, z * factor)));
    } else {
      const dir = e.deltaY > 0 ? 1 : -1;
      onSliceChange(clampSlice(currentSlice + dir));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setIsDragging(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const endDrag = () => {
    dragRef.current = null;
    pinchRef.current = null;
    setIsDragging(false);
  };

  // Touch: one finger — pan, two fingers — pinch zoom.
  const touchDistance = (touches: React.TouchList) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      dragRef.current = null;
      setIsDragging(false);
      pinchRef.current = { dist: touchDistance(e.touches), zoom };
    } else if (e.touches.length === 1) {
      dragRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const ratio = touchDistance(e.touches) / pinchRef.current.dist;
      setZoom(Math.min(10, Math.max(0.25, pinchRef.current.zoom * ratio)));
    } else if (e.touches.length === 1 && dragRef.current) {
      setPan({
        x: e.touches[0].clientX - dragRef.current.x,
        y: e.touches[0].clientY - dragRef.current.y,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0B0F17] border-b border-[#1E293B] text-xs font-mono">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-[#E5E7EB] font-bold truncate">{caseTitle}</span>
          <span className="text-[#64748B] hidden sm:inline">
            {study.patientName} · {study.patientId} · {study.studyDate}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#94A3B8] hidden md:inline">
            колесо — срезы · Ctrl+колесо — зум · перетаскивание — сдвиг · Esc — выход
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-red-500/20 transition-colors"
            title="Выйти из полноэкранного режима (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className={`relative flex-1 overflow-hidden flex items-center justify-center touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}
        onDoubleClick={resetView}
      >
        <div
          className="flex items-center justify-center w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 80ms ease-out',
          }}
        >
          <DicomSliceCanvas
            study={study}
            sliceIndex={currentSlice - 1}
            windowPreset={windowPreset}
            isInverted={isInverted}
            regions={regions}
            showRegions={showRegions}
            className="max-w-full max-h-[calc(100vh-110px)] object-contain"
          />
        </div>

        {/* HUD */}
        <div className="absolute top-3 left-3 font-mono text-[11px] text-[#10B981] space-y-0.5 pointer-events-none">
          <p className="font-bold">{study.modality} · {slice?.fileName}</p>
          <p className="text-emerald-400/80">
            {slice?.columns}×{slice?.rows} · {study.sliceThickness}
          </p>
        </div>
        <div className="absolute top-3 right-3 font-mono text-[11px] text-[#10B981] text-right space-y-0.5 pointer-events-none">
          <p className="font-bold">SLICE {currentSlice}/{totalSlices}</p>
          <p className="text-emerald-400/80">ZOOM {(zoom * 100).toFixed(0)}%</p>
        </div>
        {regionsOnSlice.length > 0 && showRegions && (
          <div className="absolute bottom-3 left-3 font-mono text-[11px] text-amber-400 bg-amber-950/70 border border-amber-500/40 rounded px-2 py-1 pointer-events-none flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5" />
            {regionsOnSlice[0].label} — требует оценки врача
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="px-3 sm:px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] bg-[#0B0F17] border-t border-[#1E293B] flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={() => setIsCine(!isCine)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
            isCine
              ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
              : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
          }`}
        >
          {isCine ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          CINE
        </button>

        <input
          type="range"
          min={1}
          max={totalSlices}
          value={currentSlice}
          onChange={(e) => onSliceChange(Number(e.target.value))}
          className="flex-1 min-w-[160px] h-1.5 bg-[#1E293B] rounded-full appearance-none cursor-pointer accent-[#0066FF]"
        />

        <div className="flex items-center gap-1">
          {PRESET_LABELS.map((p) => (
            <button
              key={p.id}
              onClick={() => onWindowPresetChange(p.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                windowPreset === p.id
                  ? 'bg-[#1E293B] border border-[#0066FF] text-[#00D2FF]'
                  : 'bg-transparent text-[#94A3B8] border border-transparent hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <button
            onClick={() => setZoom((z) => Math.min(10, z * 1.25))}
            className="p-1.5 bg-[#1E293B] rounded-md hover:text-white transition-colors"
            title="Увеличить (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))}
            className="p-1.5 bg-[#1E293B] rounded-md hover:text-white transition-colors"
            title="Уменьшить (−)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleInvert}
            className={`p-1.5 rounded-md transition-colors ${
              isInverted
                ? 'bg-[#0066FF]/20 text-[#00D2FF] border border-[#0066FF]/40'
                : 'bg-[#1E293B] hover:text-white'
            }`}
            title="Инверсия"
          >
            <Contrast className="w-4 h-4" />
          </button>
          {regions.length > 0 && (
            <button
              onClick={() => setShowRegions(!showRegions)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-colors ${
                showRegions
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
              title="Показать/скрыть зоны внимания AI"
            >
              {showRegions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              AI ROI
            </button>
          )}
          <button
            onClick={resetView}
            className="p-1.5 bg-[#1E293B] rounded-md hover:text-amber-400 transition-colors"
            title="Сброс вида (0 / двойной клик)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
