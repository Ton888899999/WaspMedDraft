'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Edit3,
  Check,
  Search,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { CaseData, TraceabilityItem, SignatureData } from '@/lib/types';

interface ReportEditorProps {
  currentCase: CaseData;
  findingsText: string;
  onFindingsTextChange: (text: string) => void;
  onImpressionChange?: (text: string) => void;
  onJumpToSlice?: (slice: number) => void;
  signatureData: SignatureData;
  onRegenerate: () => void;
  aiProviderLabel?: string;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  currentCase,
  findingsText,
  onFindingsTextChange,
  onImpressionChange,
  onJumpToSlice,
  signatureData,
  onRegenerate,
  aiProviderLabel = 'RADIOLOGY_SYSTEM (Gemini/Claude)',
}) => {
  const [selectedTrace, setSelectedTrace] = useState<TraceabilityItem | null>(null);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [isEditingImpression, setIsEditingImpression] = useState(false);
  const [localImpression, setLocalImpression] = useState(currentCase.impression);

  // Sync local impression when case changes (new AI generation)
  React.useEffect(() => {
    setLocalImpression(currentCase.impression);
    setIsEditingImpression(false);
  }, [currentCase.impression]);

  const handleImpressionChange = (v: string) => {
    setLocalImpression(v);
    onImpressionChange?.(v);
  };

  // Render findings text with interactive clickable highlighted trace spans
  const renderHighlightedFindings = () => {
    if (isEditingRaw) {
      return (
        <textarea
          value={findingsText}
          onChange={(e) => onFindingsTextChange(e.target.value)}
          rows={7}
          className="w-full p-3 rounded-xl bg-[#0B0F17] border border-cyan-500/50 text-[#E5E7EB] text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-y"
          placeholder="Введите или отредактируйте текст протокола описания..."
        />
      );
    }

    // Split and highlight phrases
    let renderedElements: React.ReactNode[] = [];
    let remainingText = findingsText;

    // Sort traceable items by length descending so longer phrases match first
    const sortedTrace = [...currentCase.traceableItems].sort(
      (a, b) => b.phrase.length - a.phrase.length
    );

    let keyIndex = 0;

    // Simple parser to highlight matching phrases in the text
    const highlightRecursive = (text: string): React.ReactNode[] => {
      for (const item of sortedTrace) {
        const index = text.indexOf(item.phrase);
        if (index !== -1) {
          const before = text.substring(0, index);
          const match = text.substring(index, index + item.phrase.length);
          const after = text.substring(index + item.phrase.length);

          return [
            ...highlightRecursive(before),
            <span
              key={`trace-${keyIndex++}`}
              onClick={() => {
                setSelectedTrace(item);
                if (item.targetSlice && onJumpToSlice) {
                  onJumpToSlice(item.targetSlice);
                }
              }}
              className="relative inline cursor-pointer px-1 py-0.5 my-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400 transition-all font-medium group"
              title="Нажмите для просмотра источника и среза AI (Traceability)"
            >
              {match}
              <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">
                🔍 {item.slices}
              </span>
            </span>,
            ...highlightRecursive(after),
          ];
        }
      }
      return [text];
    };

    renderedElements = highlightRecursive(remainingText);

    return (
      <div className="text-xs leading-relaxed space-y-2 text-[#E5E7EB]/90 select-text font-sans">
        {renderedElements}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-[#111827] rounded-xl border border-[#1E293B] p-4 flex flex-col gap-4 shadow-xl relative"
    >
      {/* 1. PROTOCOL HEADER */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-sm text-[#E5E7EB] tracking-tight">
            {currentCase.protocolName}
          </h2>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
            <span>⚠️ ИИ черновиги</span>
          </span>
        </div>

        {/* AI Confidence */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#94A3B8] font-mono">CONFIDENCE:</span>
          <span className="text-xs font-bold text-[#10B981]">{currentCase.confidenceScore}%</span>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT SECTIONS */}
      <div className="space-y-4 overflow-y-auto pr-1 max-h-[440px] custom-scrollbar">
        {/* SECTION A: STUDY AREA */}
        <section>
          <p className="text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold mb-1">
            Область исследования
          </p>
          <p className="text-xs text-[#E5E7EB]">{currentCase.studyArea}</p>
        </section>

        {/* SECTION B: FINDINGS */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold">
              Протокол описания (Тавсиф / Findings)
            </p>
            <button
              onClick={() => setIsEditingRaw(!isEditingRaw)}
              className="text-[10px] font-mono text-[#00D2FF] hover:underline cursor-pointer"
            >
              {isEditingRaw ? '✓ Просмотр' : '✎ Редактировать'}
            </button>
          </div>
          <div className="py-1">{renderHighlightedFindings()}</div>
        </section>

        {/* TRACEABILITY POPOVER */}
        <AnimatePresence>
          {selectedTrace && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-xl bg-[#162032] border border-[#F59E0B]/40 shadow-xl flex flex-col gap-2 relative"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] font-mono">
                  <Search className="w-3.5 h-3.5" />
                  <span>AI Traceability & Evidence Map</span>
                </div>
                <button
                  onClick={() => setSelectedTrace(null)}
                  className="text-xs text-[#94A3B8] hover:text-white px-1.5 py-0.5 rounded bg-[#1E293B]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block">СРЕЗЫ:</span>
                  <span className="text-[#F59E0B] font-bold">Срезы {selectedTrace.slices}</span>
                </div>
                <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block">УВЕРЕННОСТЬ:</span>
                  <span className="text-[#10B981] font-bold">{selectedTrace.confidence}%</span>
                </div>
                <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block">ROI:</span>
                  <span className="text-[#00D2FF] font-bold truncate block">{selectedTrace.roi}</span>
                </div>
              </div>

              <p className="text-xs text-[#E5E7EB] bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B] leading-relaxed font-sans">
                <strong className="text-[#F59E0B] font-mono">Анализ нейросети:</strong> {selectedTrace.details}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION C: IMPRESSION — editable */}
        <section
          className={`p-3 border-l-4 rounded-r-lg ${
            currentCase.isPathology
              ? 'bg-[#EF4444]/5 border-[#EF4444]'
              : 'bg-[#10B981]/5 border-[#10B981]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p
              className={`text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 ${
                currentCase.isPathology ? 'text-[#EF4444]' : 'text-[#10B981]'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Заключение (Хулоса / Impression)
            </p>
            <button
              onClick={() => setIsEditingImpression(!isEditingImpression)}
              className={`text-[10px] font-mono hover:underline cursor-pointer transition-colors ${
                isEditingImpression ? 'text-emerald-400' : 'text-[#00D2FF]'
              }`}
            >
              {isEditingImpression ? '✓ Готово' : '✎ Редактировать'}
            </button>
          </div>

          {isEditingImpression ? (
            <textarea
              value={localImpression}
              onChange={(e) => handleImpressionChange(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-xl bg-[#0B0F17] border border-emerald-500/40 text-[#E5E7EB] text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-y"
              placeholder="Введите или отредактируйте заключение..."
            />
          ) : (
            <p className="text-xs font-bold leading-relaxed text-[#E5E7EB] whitespace-pre-wrap">
              {localImpression}
            </p>
          )}

          {currentCase.recommendations && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold mb-1">Рекомендации (Тавсия):</p>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">{currentCase.recommendations}</p>
            </div>
          )}
        </section>
      </div>

      {/* 3. SECTION D: WARNING DISCLAIMER OR SIGNED STAMP */}
      {signatureData.isSigned ? (
        <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#10B981]/20 text-[#10B981]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#10B981]">
                Протокол утвержден и подписан ЭЦП врача
              </div>
              <div className="text-[10px] text-[#10B981]/80 font-mono">
                {signatureData.doctorName} · {signatureData.timestamp}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 whitespace-nowrap font-bold">
            ГОСТ Р 34.10 ✓
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl">
          <svg className="w-5 h-5 text-[#F59E0B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[10px] text-[#F59E0B] leading-snug">
            <strong>⚠️ ПРЕДВАРИТЕЛЬНЫЙ ЧЕРНОВИК ИИ ({aiProviderLabel}):</strong> Окончательное заключение ставит и подписывает врач-специалист.
          </p>
        </div>
      )}
    </motion.div>
  );
};
