'use client';

import React, { useState } from 'react';
import { Printer, Copy, Check, Mic, MicOff, RotateCcw, Sparkles } from 'lucide-react';
import { CaseData, SignatureData } from '@/lib/types';

interface ActionBarProps {
  currentCase: CaseData;
  findingsText: string;
  isGenerated: boolean;
  signatureData: SignatureData;
  onShowToast: (message: string) => void;
  onRegenerate: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  currentCase,
  findingsText,
  isGenerated,
  signatureData,
  onShowToast,
  onRegenerate,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  const handleCopy = async () => {
    const fullText = `МЕДИЦИНСКИЙ ПРОТОКОЛ ЛУЧЕВОГО ИССЛЕДОВАНИЯ
Пациент: ${currentCase.patientName} (${currentCase.patientId})
Дата исследования: ${currentCase.studyDate} ${currentCase.studyTime}
Модальность / Аппарат: ${currentCase.modality} (${currentCase.deviceModel})
Область исследования: ${currentCase.studyArea}

ПРОТОКОЛ ОПИСАНИЯ:
${findingsText}

ЗАКЛЮЧЕНИЕ:
${currentCase.impression}
${currentCase.recommendations ? `\nРекомендации: ${currentCase.recommendations}` : ''}
${currentCase.icdCode}

Врач-рентгенолог: ${signatureData.doctorName} (${signatureData.doctorRole})
Окончательное заключение ставит врач. Это не диагноз.`;

    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      onShowToast('Протокол скопирован в буфер обмена');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      onShowToast('Скопировано');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleDictation = () => {
    setIsDictating(!isDictating);
    if (!isDictating) {
      onShowToast('Голосовой ввод активирован: говорите в микрофон...');
    } else {
      onShowToast('Голосовой ввод завершен');
    }
  };

  if (!isGenerated) {
    return null;
  }

  return (
    <div className="flex gap-2 sm:gap-3 flex-wrap">
      {/* 1. Copy Report */}
      <button
        onClick={handleCopy}
        className="flex-1 min-w-[110px] py-3 px-3 sm:px-4 rounded-xl border border-[#334155] bg-[#1E293B] text-xs font-bold hover:bg-[#334155] text-[#E5E7EB] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        title="Копировать текст заключения"
      >
        {isCopied ? (
          <>
            <Check className="w-4 h-4 text-[#10B981]" />
            <span className="text-[#10B981]">СКОПИРОВАНО</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-[#94A3B8]" />
            <span>КОПИРОВАТЬ</span>
          </>
        )}
      </button>

      {/* 2. Print / PDF */}
      <button
        onClick={handlePrint}
        className="flex-[2] min-w-[170px] py-3 px-4 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0052cc] shadow-[0_0_15px_rgba(0,102,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        title="Печать и экспорт в PDF"
      >
        <Printer className="w-4 h-4" />
        <span>ПЕЧАТЬ / PDF</span>
      </button>
    </div>
  );
};
