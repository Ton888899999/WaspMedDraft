'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ScanLine, Target, FileText, CheckCircle2, Loader2, Bot, Key, Eye, EyeOff } from 'lucide-react';
import { CaseData } from '@/lib/types';
import { AiProvider } from '@/lib/ai/radiologyAi';

interface AiWorkspaceProps {
  currentCase: CaseData;
  isGenerating: boolean;
  generationStep: number; // 0: idle, 1: scanning, 2: detecting, 3: structuring, 4: done
  progressPercent: number;
  generationStatus?: string;
  onGenerate: (provider?: AiProvider, apiKey?: string) => void;
  isGenerated: boolean;
  selectedProvider?: AiProvider;
  onProviderChange?: (provider: AiProvider) => void;
}

const GEMINI_KEY_STORAGE = 'medai_gemini_api_key';

export const AiWorkspace: React.FC<AiWorkspaceProps> = ({
  currentCase,
  isGenerating,
  generationStep,
  progressPercent,
  generationStatus,
  onGenerate,
  isGenerated,
  selectedProvider = 'gemini',
  onProviderChange,
}) => {
  const [provider, setProvider] = React.useState<AiProvider>(selectedProvider);
  const [apiKey, setApiKey] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(GEMINI_KEY_STORAGE) ?? '';
    }
    return '';
  });
  const [showKey, setShowKey] = React.useState(false);
  const [keyError, setKeyError] = React.useState('');

  const handleProviderSelect = (p: AiProvider) => {
    setProvider(p);
    if (onProviderChange) onProviderChange(p);
  };

  const handleKeyChange = (v: string) => {
    setApiKey(v);
    setKeyError('');
    if (typeof window !== 'undefined') {
      if (v.trim()) localStorage.setItem(GEMINI_KEY_STORAGE, v.trim());
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  };

  const handleGenerate = () => {
    if (provider === 'gemini' && !apiKey.trim()) {
      setKeyError('Введите Gemini API-ключ для реального Vision-анализа');
      return;
    }
    setKeyError('');
    onGenerate(provider, apiKey.trim() || undefined);
  };

  const steps = [
    {
      id: 1,
      title: 'Растрирование и подготовка срезов',
      desc: `Рендер ключевых кадров из ${currentCase.totalSlices} срезов серии в JPEG для Vision API`,
      icon: ScanLine,
    },
    {
      id: 2,
      title: 'Vision-инференс (Gemini)',
      desc: `Анализ кадров промптом RADIOLOGY_SYSTEM · ${provider.toUpperCase()} Vision API`,
      icon: Target,
    },
    {
      id: 3,
      title: 'Синтез протокола (Тавсиф + Хулоса)',
      desc: 'Парсинг JSON {findings, conclusion} по медицинскому стандарту',
      icon: FileText,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 1. PROVIDER SELECTOR & API KEY & GENERATION BUTTON */}
      {!isGenerated && !isGenerating ? (
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col gap-2.5 shadow-lg">
          {/* Provider selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94A3B8] font-mono text-[11px] flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[#00D2FF]" />
              Провайдер ИИ-модели:
            </span>
            <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => handleProviderSelect('gemini')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                  provider === 'gemini'
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Gemini Vision
              </button>
              <button
                type="button"
                onClick={() => handleProviderSelect('local')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                  provider === 'local'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Local AI
              </button>
            </div>
          </div>

          {/* API Key input — shown only for Gemini */}
          {provider === 'gemini' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-[#64748B] flex items-center gap-1">
                <Key className="w-3 h-3" />
                Gemini API Key{' '}
                <span className="text-[#374151]">(хранится локально в браузере)</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="AIza... или AQ.Ab8RN..."
                  className={`w-full bg-[#0B0F17] border rounded-lg px-3 py-2 text-xs font-mono text-[#E5E7EB] placeholder-[#374151] outline-none pr-9 transition-colors ${
                    keyError
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-[#1E293B] focus:border-[#0066FF]/60'
                  }`}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {keyError && (
                <p className="text-[10px] text-red-400 font-mono">{keyError}</p>
              )}
              {apiKey && !keyError && (
                <p className="text-[10px] text-emerald-400 font-mono">
                  ✓ API-ключ готов · будет проанализировано{' '}
                  {Math.min(16, currentCase.totalSlices)} из {currentCase.totalSlices} срезов (Vision API)
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="w-full py-3.5 px-3 rounded-xl bg-gradient-to-r from-[#0066FF] via-[#00A3FF] to-[#00D2FF] text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(0,102,255,0.3)] flex items-center justify-center gap-2.5 hover:scale-[1.01] transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span className="tracking-wide text-center leading-snug">
              🤖 ИИ АНАЛИЗИРОВАТЬ {currentCase.totalSlices} СРЕЗОВ (RADIOLOGY AI)
            </span>
          </button>
        </div>
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
                    Инференс RADIOLOGY_SYSTEM ({provider.toUpperCase()})
                  </h3>
                  <p className="text-[10px] text-[#94A3B8] font-mono">
                    {generationStatus || `Обработка ${currentCase.totalSlices} срезов · ${currentCase.modality}`}
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
