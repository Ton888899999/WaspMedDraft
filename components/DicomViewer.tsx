'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaseData, WindowPreset } from '@/lib/types';
import { DicomStudy } from '@/lib/dicom/study';
import { AttentionRegion } from '@/lib/dicom/analyze';
import { DicomSliceCanvas } from '@/components/DicomSliceCanvas';
import { Eye, EyeOff, Maximize2, Sparkles, Target, ScanLine } from 'lucide-react';

interface DicomViewerProps {
  currentCase: CaseData;
  currentSlice: number;
  windowPreset: WindowPreset;
  zoomLevel: number;
  rotation: number;
  isInverted: boolean;
  isAiGenerated: boolean;
  showAiOverlay: boolean;
  onToggleAiOverlay: () => void;
  onSliceChange?: (slice: number) => void;
  customImageDataUrl?: string | null;
  dicomStudy?: DicomStudy | null;
  attentionRegions?: AttentionRegion[];
  onOpenFullscreen?: () => void;
}

export const DicomViewer: React.FC<DicomViewerProps> = ({
  currentCase,
  currentSlice,
  windowPreset,
  zoomLevel,
  rotation,
  isInverted,
  isAiGenerated,
  showAiOverlay,
  onToggleAiOverlay,
  customImageDataUrl,
  dicomStudy,
  attentionRegions = [],
  onOpenFullscreen,
}) => {
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number; hu: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate slice offset factor for anatomical slice variation
  const sliceRatio = (currentSlice - 1) / Math.max(1, currentCase.totalSlices - 1);
  const sliceScale = 0.94 + 0.08 * Math.sin(sliceRatio * Math.PI);
  const sliceBrightness = 0.95 + 0.1 * Math.sin(sliceRatio * Math.PI);

  // Check if AI annotation is active on current slice
  const isAnnotationOnSlice =
    currentCase.annotation &&
    currentSlice >= currentCase.annotation.activeSliceRange[0] &&
    currentSlice <= currentCase.annotation.activeSliceRange[1];

  // Get CSS filters based on windowing preset and inversion.
  // Real DICOM slices get true window/level applied to the pixel data
  // in DicomSliceCanvas, so no CSS approximation is layered on top.
  const getFilterStyle = () => {
    if (dicomStudy) return 'none';
    let base = '';
    switch (windowPreset) {
      case 'soft_tissue':
        base = 'contrast(125%) brightness(105%)';
        break;
      case 'bone':
        base = 'contrast(210%) brightness(85%) grayscale(100%)';
        break;
      case 'lung':
        base = 'contrast(170%) brightness(120%)';
        break;
      case 'brain':
        base = 'contrast(140%) brightness(100%)';
        break;
      default:
        base = 'contrast(120%) brightness(100%)';
    }
    if (isInverted) {
      base += ' invert(100%)';
    }
    return base;
  };

  const getWindowValues = () => {
    switch (windowPreset) {
      case 'soft_tissue':
        return 'W: 350 L: 40 (Soft)';
      case 'bone':
        return 'W: 2000 L: 500 (Bone)';
      case 'lung':
        return 'W: 1500 L: -600 (Lung)';
      case 'brain':
        return 'W: 80 L: 35 (Brain)';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    // Approximate HU based on case type & coordinate
    const fakeHU = Math.round((Math.sin(x / 50) * Math.cos(y / 50) * 80) + (windowPreset === 'lung' ? -650 : 35));
    setCrosshairPos({ x, y, hu: fakeHU });
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
  };

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden border border-[#1E293B] bg-black shadow-2xl select-none">
      {/* Top Bar inside Viewer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B0F17]/90 border-b border-[#1E293B]/80 text-[11px] font-mono text-[#94A3B8] z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-[#E5E7EB] font-semibold">{currentCase.modality}</span>
          <span className="text-[#64748B]">·</span>
          <span>{currentCase.bodyPart}</span>
        </div>
        <div className="flex items-center gap-2">
          {dicomStudy && (
            <button
              onClick={onOpenFullscreen}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E293B] text-[#94A3B8] border border-slate-700 hover:text-white hover:border-[#0066FF] transition-colors"
              title="Полноэкранный режим чтения (зум, панорама, кинопетля)"
            >
              <Maximize2 className="w-3 h-3" />
              <span>FULLSCREEN</span>
            </button>
          )}
          {isAiGenerated && dicomStudy && attentionRegions.length > 0 && (
            <button
              onClick={onToggleAiOverlay}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                showAiOverlay
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="Показать/скрыть зоны внимания AI"
            >
              {showAiOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>AI ROI {showAiOverlay ? 'ON' : 'OFF'}</span>
            </button>
          )}
          {isAiGenerated && currentCase.annotation && (
            <button
              onClick={onToggleAiOverlay}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                showAiOverlay
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="Показать/скрыть AI аннотацию"
            >
              {showAiOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>AI ROI {showAiOverlay ? 'ON' : 'OFF'}</span>
            </button>
          )}
          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            DICOM 3.0
          </span>
        </div>
      </div>

      {/* Main Medical Image Canvas / Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-[4/3] sm:aspect-square max-h-[460px] bg-[#030712] overflow-hidden flex items-center justify-center cursor-crosshair group"
      >
        {/* Phosphor Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* Scalable & Rotatable Image Container */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            filter: getFilterStyle(),
          }}
        >
          {/* RENDER MEDICAL IMAGES */}
          {dicomStudy ? (
            <div className="relative w-full h-full p-4 flex items-center justify-center">
              <DicomSliceCanvas
                study={dicomStudy}
                sliceIndex={Math.max(0, currentSlice - 1)}
                windowPreset={windowPreset}
                isInverted={isInverted}
                regions={attentionRegions}
                showRegions={isAiGenerated && showAiOverlay}
              />
            </div>
          ) : customImageDataUrl ? (
            <div className="relative w-full h-full p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={customImageDataUrl}
                alt="Uploaded DICOM slice"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          ) : currentCase.caseType === 'brain' ? (
            /* =================================================== */
            /* CASE 1: BRAIN AXIAL MRI (T2-FLAIR / DWI) */
            /* =================================================== */
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full max-w-[420px] max-h-[420px] drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              style={{
                transform: `scale(${sliceScale})`,
                opacity: sliceBrightness,
              }}
            >
              <defs>
                <radialGradient id="brainParenchyma" cx="50%" cy="48%" r="48%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="60%" stopColor="#334155" />
                  <stop offset="85%" stopColor="#1e293b" />
                  <stop offset="98%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
                <radialGradient id="cortexGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="#64748b" stopOpacity="0.8" />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="ischemiaGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#cbd5e1" stopOpacity="0.85" />
                  <stop offset="80%" stopColor="#64748b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
                <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
              </defs>

              {/* Skull Outline (Calvarium) */}
              <path
                d="M250,35 C140,35 70,110 65,230 C60,340 120,445 250,455 C380,445 440,340 435,230 C430,110 360,35 250,35 Z"
                fill="#000000"
                stroke="#475569"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Diploe Bone Layer */}
              <path
                d="M250,42 C146,42 77,114 72,230 C67,336 125,438 250,448 C375,438 433,336 428,230 C423,114 354,42 250,42 Z"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                opacity="0.7"
              />

              {/* Cerebral Hemispheres Brain Tissue */}
              <path
                d="M250,55 C155,55 88,122 84,230 C80,328 132,425 250,435 C368,425 420,328 416,230 C412,122 345,55 250,55 Z"
                fill="url(#brainParenchyma)"
              />

              {/* Interhemispheric Fissure (Срединная щель) */}
              <path
                d="M250,55 Q248,150 250,250 Q252,350 250,435"
                stroke="#090d16"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />

              {/* Cortical Sulci & Gyri (Извилины и борозды) */}
              <g stroke="#1a2436" strokeWidth="2.5" fill="none" opacity="0.85">
                {/* Left hemisphere sulci (anatomic right in radiological view) */}
                <path d="M110,140 Q150,160 170,140 Q190,120 235,145" />
                <path d="M95,210 Q140,215 165,195 Q190,180 235,210" />
                <path d="M98,280 Q135,260 160,285 Q195,300 235,275" />
                <path d="M120,350 Q160,335 185,360 Q215,370 238,340" />

                {/* Right hemisphere sulci (anatomic left / affected side) */}
                <path d="M390,140 Q350,160 330,140 Q310,120 265,145" />
                <path d="M405,210 Q360,215 335,195 Q310,180 265,210" />
                <path d="M402,280 Q365,260 340,285 Q305,300 265,275" />
                <path d="M380,350 Q340,335 315,360 Q285,370 262,340" />
              </g>

              {/* Lateral Ventricles (Боковые желудочки) */}
              {/* Right Frontal/Occipital Horn */}
              <path
                d="M238,160 C234,175 220,195 218,225 C216,255 225,280 236,305 C242,280 244,240 242,200 C241,180 242,165 238,160 Z"
                fill="#050811"
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* Left Frontal/Occipital Horn (affected side) */}
              <path
                d="M262,160 C266,175 280,195 282,225 C284,255 275,280 264,305 C258,280 256,240 258,200 C259,180 258,165 262,160 Z"
                fill="#050811"
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* Third Ventricle & Septum Pellucidum */}
              <line x1="250" y1="180" x2="250" y2="280" stroke="#050811" strokeWidth="3" />

              {/* Basal Ganglia / Thalamus contours */}
              <ellipse cx="215" cy="245" rx="18" ry="24" fill="#384556" opacity="0.6" />
              <ellipse cx="285" cy="245" rx="18" ry="24" fill="#384556" opacity="0.6" />

              {/* PATHOLOGY: Acute Ischemic Hyperintense Lesion (Left MCA Territory) */}
              <g filter="url(#blurFilter)">
                <ellipse
                  cx="340"
                  cy="210"
                  rx="38"
                  ry="28"
                  fill="url(#ischemiaGlow)"
                  className="animate-pulse"
                  style={{ animationDuration: '3s' }}
                />
                <circle cx="348" cy="205" r="16" fill="#ffffff" opacity="0.9" />
                <ellipse cx="332" cy="218" rx="18" ry="12" fill="#e2e8f0" opacity="0.8" />
              </g>
            </svg>
          ) : currentCase.caseType === 'lung' ? (
            /* =================================================== */
            /* CASE 2: CHEST CT (AXIAL HRCT) */
            /* =================================================== */
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full max-w-[420px] max-h-[420px] drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              style={{
                transform: `scale(${sliceScale})`,
                opacity: sliceBrightness,
              }}
            >
              <defs>
                <radialGradient id="lungParenchyma" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#080c14" />
                  <stop offset="85%" stopColor="#020408" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <radialGradient id="pneumoniaInfiltrate" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
                  <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#475569" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#080c14" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Chest Wall & Rib Cage */}
              <ellipse cx="250" cy="260" rx="195" ry="170" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
              <ellipse cx="250" cy="260" rx="185" ry="160" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" opacity="0.6" />

              {/* Anterior Sternum Bone */}
              <path d="M225,98 L275,98 L265,115 L235,115 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />

              {/* Posterior Vertebra & Spinal Canal */}
              <g>
                <circle cx="250" cy="405" r="28" fill="#e2e8f0" stroke="#64748b" strokeWidth="3" />
                <circle cx="250" cy="405" r="11" fill="#020408" />
                {/* Rib Cross-sections */}
                <ellipse cx="80" cy="220" rx="10" ry="6" fill="#ffffff" />
                <ellipse cx="75" cy="280" rx="10" ry="6" fill="#ffffff" />
                <ellipse cx="85" cy="340" rx="10" ry="6" fill="#ffffff" />
                <ellipse cx="420" cy="220" rx="10" ry="6" fill="#ffffff" />
                <ellipse cx="425" cy="280" rx="10" ry="6" fill="#ffffff" />
                <ellipse cx="415" cy="340" rx="10" ry="6" fill="#ffffff" />
              </g>

              {/* Right Lung Field (Anatomic Right = Visual Left) */}
              <path
                d="M230,150 C160,140 105,180 100,260 C95,340 135,385 210,390 C225,390 230,360 230,320 C230,260 235,190 230,150 Z"
                fill="url(#lungParenchyma)"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* Left Lung Field (Visual Right) */}
              <path
                d="M270,150 C340,140 395,180 400,260 C405,340 365,385 290,390 C275,390 270,360 270,320 C270,260 265,190 270,150 Z"
                fill="url(#lungParenchyma)"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* Mediastinum / Heart / Great Vessels */}
              <path
                d="M230,150 C240,135 260,135 270,150 C285,180 295,240 280,310 C270,360 230,360 220,310 C205,240 215,180 230,150 Z"
                fill="#334155"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Ascending & Descending Aorta */}
              <circle cx="245" cy="180" r="14" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
              <circle cx="265" cy="350" r="16" fill="#1e293b" stroke="#64748b" strokeWidth="2" />

              {/* Pulmonary Vascular Branching (Сосудистый рисунок) */}
              <g stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.7">
                {/* Left lung tree */}
                <path d="M280,240 Q310,230 350,220" />
                <path d="M310,230 Q340,260 370,270" />
                <path d="M290,280 Q330,300 360,330" />
                {/* Right lung tree (upper) */}
                <path d="M220,240 Q190,230 150,220" />
                <path d="M190,230 Q160,260 130,270" />
              </g>

              {/* PATHOLOGY: S9 Right Lower Lobe Consolidation (Visual Left Bottom) */}
              <g>
                <ellipse
                  cx="160"
                  cy="320"
                  rx="44"
                  ry="34"
                  fill="url(#pneumoniaInfiltrate)"
                  className="animate-pulse"
                  style={{ animationDuration: '3.5s' }}
                />
                <path
                  d="M135,305 Q160,320 185,335 M145,330 Q165,335 180,310"
                  stroke="#080c14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <circle cx="165" cy="325" r="3" fill="#020408" />
              </g>
            </svg>
          ) : (
            /* =================================================== */
            /* CASE 3: KNEE SAGITTAL MRI (NORMAL) */
            /* =================================================== */
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full max-w-[420px] max-h-[420px] drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              style={{
                transform: `scale(${sliceScale})`,
                opacity: sliceBrightness,
              }}
            >
              <defs>
                <linearGradient id="boneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              {/* Soft Tissue Contour of Leg */}
              <path
                d="M140,40 C120,150 110,300 130,460 L380,460 C390,320 400,160 370,40 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="3"
              />

              {/* Femur Condyle Bone (Бедренная кость) */}
              <path
                d="M190,50 L190,160 C190,230 290,250 310,200 C320,170 320,50 320,50 Z"
                fill="url(#boneGradient)"
                stroke="#94a3b8"
                strokeWidth="4"
              />
              {/* Femoral Cartilage (Суставной хрящ) */}
              <path
                d="M190,180 C200,235 295,245 312,198"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Tibia Bone Plateau (Большеберцовая кость) */}
              <path
                d="M170,285 C230,270 310,270 330,290 L310,450 L190,450 Z"
                fill="url(#boneGradient)"
                stroke="#94a3b8"
                strokeWidth="4"
              />
              {/* Tibial Cartilage */}
              <path
                d="M175,283 C230,272 305,272 325,288"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Patella (Надколенник) */}
              <path
                d="M130,130 C115,160 120,195 145,200 C155,190 155,140 145,130 Z"
                fill="#334155"
                stroke="#cbd5e1"
                strokeWidth="3"
              />

              {/* Patellar Tendon (Связка надколенника) */}
              <path
                d="M140,200 Q145,240 175,290"
                stroke="#030712"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />

              {/* Hoffa's Fat Pad (Жировое тело Гоффа) */}
              <polygon points="155,205 185,275 220,270 200,210" fill="#475569" opacity="0.4" />

              {/* Cruciate Ligaments (ACL / PCL - Крестообразные связки - интактные, темные тяжи) */}
              <path d="M210,240 L280,280" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
              <path d="M275,230 L220,280" stroke="#000000" strokeWidth="5" strokeLinecap="round" />

              {/* Menisci (Мениски - треугольные темные структуры) */}
              <polygon points="185,270 205,270 195,258" fill="#000000" />
              <polygon points="295,270 315,270 305,258" fill="#000000" />
            </svg>
          )}

          {/* AI PATHOLOGY ANNOTATION OVERLAY (Smooth animated bounding ring + badge) */}
          <AnimatePresence>
            {isAiGenerated && showAiOverlay && isAnnotationOnSlice && currentCase.annotation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute inset-0 pointer-events-none"
              >
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${currentCase.annotation.cx}%`,
                    top: `${currentCase.annotation.cy}%`,
                    width: `${currentCase.annotation.rx * 2}%`,
                    height: `${currentCase.annotation.ry * 2}%`,
                  }}
                >
                  {/* Glowing dashed bounding ellipse */}
                  <div className="w-full h-full border-2 border-dashed border-red-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)] bg-red-500/10" />

                  {/* Target Crosshair marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-400">
                    <Target className="w-4 h-4" />
                  </div>

                  {/* Floating AI Label Tag */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-950/90 text-red-300 text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/60 shadow-lg flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-red-400 animate-spin" />
                    <span>{currentCase.annotation.label}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle Crosshair Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#10B981]/10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#10B981]/10 pointer-events-none" />
        <div className="absolute inset-0 border border-[#0066FF]/20 group-hover:border-[#0066FF]/50 transition-colors pointer-events-none" />

        {/* ======================================================== */}
        {/* REALISTIC PACS CORNER HUD OVERLAYS (Phosphor Green) */}
        {/* ======================================================== */}

        {/* Top-Left HUD */}
        <div className="absolute top-3 left-3 font-mono text-[10px] text-[#10B981] z-10 space-y-0.5 pointer-events-none">
          <p className="font-bold tracking-wider">{currentCase.patientId}</p>
          <p className="text-emerald-400/80">{currentCase.patientAgeSex}</p>
        </div>

        {/* Top-Right HUD */}
        <div className="absolute top-3 right-3 font-mono text-[10px] text-[#10B981] z-10 text-right space-y-0.5 pointer-events-none">
          <p>STUDY DATE: {currentCase.studyDate}</p>
          <p className="text-emerald-400/80">TIME: {currentCase.studyTime}</p>
        </div>

        {/* Bottom-Left HUD */}
        <div className="absolute bottom-3 left-3 font-mono text-[10px] text-[#10B981] z-10 space-y-0.5 pointer-events-none">
          {dicomStudy ? (
            <p>{dicomStudy.slices[Math.max(0, currentSlice - 1)]?.fileName}</p>
          ) : (
            <p>TR: 4500ms | TE: 110ms</p>
          )}
          <p>SLICE THICKNESS: {currentCase.sliceThickness}</p>
        </div>

        {/* Bottom-Right HUD */}
        <div className="absolute bottom-3 right-3 font-mono text-[10px] text-[#10B981] z-10 text-right space-y-0.5 pointer-events-none">
          <p>WINDOW: {windowPreset.toUpperCase()}</p>
          <p>ZOOM: {zoomLevel}%</p>
        </div>

        {/* Orientation Markers */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-slate-500 font-bold pointer-events-none">
          A
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-slate-500 font-bold pointer-events-none">
          P
        </div>
        <div className="absolute top-1/2 left-2 -translate-y-1/2 font-mono text-[10px] text-slate-500 font-bold pointer-events-none">
          R
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 font-mono text-[10px] text-slate-500 font-bold pointer-events-none">
          L
        </div>

        {/* Active Cursor Hover HUD (simulated HU — hidden for real DICOM data) */}
        {crosshairPos && !dicomStudy && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[10px] text-cyan-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 pointer-events-none">
            X:{crosshairPos.x} Y:{crosshairPos.y} | {crosshairPos.hu} HU
          </div>
        )}
      </div>
    </div>
  );
};
