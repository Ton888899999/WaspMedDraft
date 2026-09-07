'use client';

import React from 'react';
import { CaseData, SignatureData } from '@/lib/types';
import { Activity } from 'lucide-react';

interface PrintReportTemplateProps {
  currentCase: CaseData;
  findingsText: string;
  signatureData: SignatureData;
}

export const PrintReportTemplate: React.FC<PrintReportTemplateProps> = ({
  currentCase,
  findingsText,
  signatureData,
}) => {
  return (
    <div className="hidden print:block text-black bg-white p-0 max-w-4xl mx-auto font-serif leading-normal text-[13px] print:break-inside-avoid">
      {/* Letterhead */}
      <div className="border-b-[3px] border-double border-slate-900 pb-3 mb-4 flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 border-2 border-slate-900 rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-slate-900" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900 font-sans">
              {currentCase.hospitalName}
            </h1>
            <p className="text-[11px] text-slate-600 font-sans">
              Отделение лучевой и магнитно-резонансной диагностики · Лицензия ЛО-77-01-018942
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Система поддержки принятия врачебных решений WaspMed Draft (ГОСТ Р 59276-2020)
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-[11px] text-slate-700 shrink-0">
          <div className="font-bold text-xs font-sans tracking-wide">ПРОТОКОЛ ИССЛЕДОВАНИЯ</div>
          <div>№ {currentCase.patientId.replace('#', '')}</div>
          <div>Дата: {currentCase.studyDate}{currentCase.studyTime ? `, ${currentCase.studyTime}` : ''}</div>
        </div>
      </div>

      {/* Patient & Exam Meta */}
      <table className="w-full text-xs mb-4 border border-slate-400 border-collapse">
        <tbody>
          <tr>
            <td className="py-1.5 px-2 font-sans font-bold text-slate-600 text-[10px] uppercase tracking-wide w-[18%] border border-slate-300 bg-slate-50 align-top">
              Пациент
            </td>
            <td className="py-1.5 px-2 font-semibold text-slate-900 w-[32%] border border-slate-300">
              {currentCase.patientName}
            </td>
            <td className="py-1.5 px-2 font-sans font-bold text-slate-600 text-[10px] uppercase tracking-wide w-[18%] border border-slate-300 bg-slate-50 align-top">
              Возраст / Пол
            </td>
            <td className="py-1.5 px-2 text-slate-900 border border-slate-300">
              {currentCase.patientAgeSex}
            </td>
          </tr>
          <tr>
            <td className="py-1.5 px-2 font-sans font-bold text-slate-600 text-[10px] uppercase tracking-wide border border-slate-300 bg-slate-50 align-top">
              Модальность
            </td>
            <td className="py-1.5 px-2 text-slate-900 border border-slate-300">
              {currentCase.modality}
            </td>
            <td className="py-1.5 px-2 font-sans font-bold text-slate-600 text-[10px] uppercase tracking-wide border border-slate-300 bg-slate-50 align-top">
              Томограф
            </td>
            <td className="py-1.5 px-2 text-slate-900 border border-slate-300">
              {currentCase.deviceModel}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Findings */}
      <div className="mb-4">
        <h2 className="text-[11px] font-sans font-bold uppercase tracking-widest text-slate-900 mb-1.5 border-b border-slate-400 pb-1">
          Протокол описания
        </h2>
        <div className="text-[13px] text-slate-800 text-justify leading-snug whitespace-pre-wrap">
          {findingsText}
        </div>
      </div>

      {/* Impression */}
      <div className="mb-5 p-3 bg-slate-50 border-l-4 border-slate-800">
        <h2 className="text-[11px] font-sans font-bold uppercase tracking-widest text-slate-900 mb-1">
          Заключение
        </h2>
        <p className="text-[13px] font-bold text-slate-900 leading-relaxed">
          {currentCase.impression}
        </p>
        {currentCase.recommendations && (
          <p className="text-[13px] text-slate-700 mt-2">
            <strong className="font-sans">Рекомендации:</strong> {currentCase.recommendations}
          </p>
        )}
        {(currentCase.icdCode || currentCase.biradsOrRadlex) && (
          <p className="text-[10px] text-slate-600 font-mono mt-2">
            {currentCase.icdCode} {currentCase.biradsOrRadlex ? `· ${currentCase.biradsOrRadlex}` : ''}
          </p>
        )}
      </div>

      {/* Reporting Doctor, Signature & Stamp */}
      <div className="mt-6 pt-3 border-t-2 border-slate-900 flex items-end justify-between gap-6">
        <div>
          <div className="text-xs font-sans font-bold text-slate-900">
            Врач-рентгенолог: {signatureData.doctorName}
          </div>
          <div className="text-[11px] font-sans text-slate-600">
            {signatureData.doctorRole}
          </div>
          <div className="mt-2 text-[10px] font-sans text-slate-600 italic">
            Окончательное заключение ставит врач. Это не диагноз.
          </div>
        </div>

        <div className="flex items-end gap-5 shrink-0 font-sans">
          <div className="text-center">
            <div className="w-36 border-b border-slate-500 h-6" />
            <div className="text-[9px] text-slate-500 mt-0.5 tracking-wide">подпись</div>
          </div>
          <div className="w-16 h-16 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 tracking-wider shrink-0">
            М.П.
          </div>
        </div>
      </div>

      <div className="mt-4 pt-1.5 border-t border-slate-200 text-[9px] font-sans text-slate-400 flex justify-between">
        <span>Документ сформирован системой WaspMed Draft</span>
        <span>{currentCase.studyDate}{currentCase.studyTime ? ` · ${currentCase.studyTime}` : ''}</span>
      </div>
    </div>
  );
};
