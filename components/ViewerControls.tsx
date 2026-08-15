'use client';

import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  SunMedium,
  Layers,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Contrast,
} from 'lucide-react';
import { WindowPreset } from '@/lib/types';

interface ViewerControlsProps {
  currentSlice: number;
  totalSlices: number;
  onSliceChange: (slice: number) => void;
  windowPreset: WindowPreset;
  onWindowPresetChange: (preset: WindowPreset) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  rotation: number;
  onRotateChange: (rot: number) => void;
  isInverted: boolean;
  onToggleInvert: () => void;
  onResetView: () => void;
  caseType?: string;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  currentSlice,
  totalSlices,
  onSliceChange,
  windowPreset,
  onWindowPresetChange,
  zoomLevel,
  onZoomChange,
  rotation,
  onRotateChange,
  isInverted,
  onToggleInvert,
  onResetView,
  caseType = 'brain',
}) => {
  const [isPlayingCine, setIsPlayingCine] = useState(false);

  // Cine-loop autoplay simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingCine) {
      interval = setInterval(() => {
        onSliceChange(currentSlice >= totalSlices ? 1 : currentSlice + 1);
      }, 140);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingCine, totalSlices, currentSlice, onSliceChange]);

  const handleZoomIn = () => onZoomChange(Math.min(250, zoomLevel + 25));
  const handleZoomOut = () => onZoomChange(Math.max(75, zoomLevel - 25));
  const handleRotate = () => onRotateChange((rotation + 90) % 360);

  return (
    <div className="p-3 bg-[#111827] rounded-xl border border-[#1E293B] flex flex-col gap-3">
      {/* 1. SLICE SLIDER & SCRUBBER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#E5E7EB] font-bold">
            <Layers className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span className="text-[11px] font-mono text-[#94A3B8] whitespace-nowrap">
              SLICE: {currentSlice}/{totalSlices}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPlayingCine(!isPlayingCine)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                isPlayingCine
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                  : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
              title="Кинопетля (Cine Loop Автопрокрутка)"
            >
              {isPlayingCine ? <Pause className="w-3 h-3 text-[#F59E0B]" /> : <Play className="w-3 h-3 text-[#00D2FF]" />}
              <span>{isPlayingCine ? 'ПАУЗА' : 'CINE'}</span>
            </button>
            <button
              onClick={() => onSliceChange(Math.max(1, currentSlice - 1))}
              className="p-2 sm:p-1 rounded-md bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
              title="Предыдущий срез"
            >
              <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={() => onSliceChange(Math.min(totalSlices, currentSlice + 1))}
              className="p-2 sm:p-1 rounded-md bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
              title="Следующий срез"
            >
              <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* Custom Progress Track Slider */}
        <div className="relative flex items-center w-full">
          <input
            type="range"
            min={1}
            max={totalSlices}
            value={currentSlice}
            onChange={(e) => onSliceChange(Number(e.target.value))}
            className="w-full h-2.5 sm:h-1.5 bg-[#1E293B] rounded-full appearance-none cursor-pointer accent-[#0066FF] focus:outline-none touch-none"
          />
        </div>
      </div>

      {/* 2. WINDOWING PRESETS & TOOL ACTIONS */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] flex-wrap gap-2">
        {/* Windowing Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onWindowPresetChange('soft_tissue')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              windowPreset === 'soft_tissue'
                ? 'bg-[#1E293B] border border-[#0066FF] text-[#00D2FF]'
                : 'bg-transparent text-[#94A3B8] border border-transparent hover:text-white'
            }`}
          >
            SOFT TISSUE
          </button>

          <button
            onClick={() => onWindowPresetChange('bone')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              windowPreset === 'bone'
                ? 'bg-[#1E293B] border border-[#0066FF] text-[#00D2FF]'
                : 'bg-transparent text-[#94A3B8] border border-transparent hover:text-white'
            }`}
          >
            BONE
          </button>

          <button
            onClick={() => onWindowPresetChange(caseType === 'lung' ? 'lung' : 'brain')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              windowPreset === 'lung' || windowPreset === 'brain'
                ? 'bg-[#1E293B] border border-[#0066FF] text-[#00D2FF]'
                : 'bg-transparent text-[#94A3B8] border border-transparent hover:text-white'
            }`}
          >
            {caseType === 'lung' ? 'LUNG' : 'BRAIN'}
          </button>
        </div>

        {/* Action Icon Tools */}
        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <button
            onClick={handleZoomIn}
            className="p-2.5 sm:p-1.5 bg-[#1E293B] rounded-md hover:text-white transition-colors"
            title="Увеличить (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2.5 sm:p-1.5 bg-[#1E293B] rounded-md hover:text-white transition-colors"
            title="Уменьшить (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleRotate}
            className="p-2.5 sm:p-1.5 bg-[#1E293B] rounded-md hover:text-white transition-colors"
            title="Поворот 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleInvert}
            className={`p-2.5 sm:p-1.5 rounded-md transition-colors ${
              isInverted
                ? 'bg-[#0066FF]/20 text-[#00D2FF] border border-[#0066FF]/40'
                : 'bg-[#1E293B] hover:text-white'
            }`}
            title="Инвертировать цвета (Негатив)"
          >
            <Contrast className="w-4 h-4" />
          </button>

          <button
            onClick={onResetView}
            className="p-2.5 sm:p-1.5 bg-[#1E293B] rounded-md hover:text-amber-400 transition-colors"
            title="Сброс"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
