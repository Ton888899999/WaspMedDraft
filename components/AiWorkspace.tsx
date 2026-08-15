'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ScanLine, Target, FileText, CheckCircle2, Loader2, Bot, Cpu } from 'lucide-react';
import { CaseData } from '@/lib/types';

interface AiWorkspaceProps {
  currentCase: CaseData;
  isGenerating: boolean;
  generationStep: number; // 0: idle, 1: scanning, 2: detecting, 3: structuring, 4: done
  progressPercent: number;
  onGenerate: () => void;
  isGenerated: boolean;
}

export const AiWorkspace: React.FC<AiWorkspaceProps> = ({
  currentCase,
  isGenerating,
  generationStep,
  progressPercent,
  onGenerate,
  isGenerated,
}) => {
  const steps = [
    {
      id: 1,
      title: 'Анализ и сегментация срезов...',
      desc: '3D реконструкция DICOM вокселей, выравнивание анатомических ориентиров',
      icon: ScanLine,
    },
    {
      id: 2,
      title: 'Поиск патологических очагов...',
      desc: 'Компьютерное зрение (CNN-Transformer), сравнение с базой RadLex 2026',
      icon: Target,
    },
    {
      id: 3,
      title: 'Составление заключения (NLP)...',
      desc: 'Синтез структурированного описания по клиническим стандартам Минздрава',
      icon: FileText,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 1. MAIN AI GENERATION BUTTON */}
      {!isGenerated && !isGenerating ? (
        <button
          onClick={onGenerate}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00D2FF] text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(0,102,255,0.3)] flex items-center justify-center gap-2.5 hover:scale-[1.01] transition-transform active:scale-95 cursor-pointer"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
          </svg>
          <span className="tracking-wide">СГЕНЕРИРОВАТЬ ЧЕРНОВИК ПРОТОКОЛА (AI DRAFT)</span>
        </button>
      ) : null}

      {/* 2. GENERATION PROGRESS PIPELINE */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-[#111827] border border-[#1E293B] shadow-2xl flex flex-col gap-3.5"
          >
            {/* Pipeline Header */}
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#0066FF]/10 text-[#00D2FF]">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#E5E7EB]">
                    Инференс нейросетевого пайплайна
                  </h3>
                  <p className="text-[10px] text-[#94A3B8] font-mono">
                    Обработка {currentCase.totalSlices} срезов · {currentCase.modality}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-base font-bold text-[#00D2FF]">{progressPercent}%</span>
              </div>
            </div>

            {/* Steps List */}
            <div className="flex flex-col gap-2">
              {steps.map((s) => {
                const isDone = generationStep > s.id;
                const isCurrent = generationStep === s.id;
                const Icon = s.icon;

                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-[#0066FF]/10 border border-[#0066FF]/40 shadow-[0_0_15px_rgba(0,102,255,0.15)]'
                        : isDone
                        ? 'bg-[#0B0F17] border border-[#10B981]/20'
                        : 'bg-[#0B0F17]/50 border border-transparent opacity-50'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#00D2FF] animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 text-[#64748B]" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-[#00D2FF]'
                              : isDone
                              ? 'text-[#E5E7EB]'
                              : 'text-[#64748B]'
                          }`}
                        >
                          Шаг {s.id}: {s.title}
                        </span>
                        {isDone && (
                          <span className="text-[10px] font-mono text-[#10B981]">Готово ✓</span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-[#00D2FF] animate-pulse">
                            Выполняется...
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] to-[#00D2FF] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,210,255,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
