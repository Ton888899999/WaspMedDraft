'use client';

import React from 'react';
import { CaseData, SignatureData } from '@/lib/types';
import { Activity, ShieldCheck } from 'lucide-react';

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
    <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto font-sans leading-normal">
      {/* Clinic Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
            {currentCase.hospitalName}
          </h1>
          <p className="text-xs text-slate-600">
            Отделение лучевой и магнитно-резонансной диагностики · Лицензия ЛО-77-01-018942
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Система поддержки принятия врачебных решений WaspMed Draft (ГОСТ Р 59276-2020)
          </p>
        </div>
        <div className="text-right font-mono text-xs text-slate-700">
          <div className="font-bold text-sm">ПРОТОКОЛ ИССЛЕДОВАНИЯ</div>
          <div>№ {currentCase.patientId.replace('#', '')}</div>
          <div>Дата: {currentCase.studyDate}</div>
        </div>
      </div>

      {/* Patient & Exam Meta Grid */}
      <table className="w-full text-xs mb-6 border-collapse">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="py-1 font-bold text-slate-700 w-1/4">Пациент:</td>
            <td className="py-1 font-semibold text-slate-900">{currentCase.patientName}</td>
            <td className="py-1 font-bold text-slate-700 w-1/4">Возраст / Пол:</td>
            <td className="py-1 text-slate-900">{currentCase.patientAgeSex}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="py-1 font-bold text-slate-700">Модальность:</td>
            <td className="py-1 text-slate-900">{currentCase.modality}</td>
            <td className="py-1 font-bold text-slate-700">Томограф:</td>
            <td className="py-1 text-slate-900">{currentCase.deviceModel}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="py-1 font-bold text-slate-700">Толщина среза:</td>
            <td className="py-1 text-slate-900">{currentCase.sliceThickness}</td>
            <td className="py-1 font-bold text-slate-700">Контрастирование:</td>
            <td className="py-1 text-slate-900">{currentCase.contrast}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="py-1 font-bold text-slate-700">Область:</td>
            <td className="py-1 text-slate-900" colSpan={3}>
              {currentCase.studyArea}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Findings */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-400 pb-1">
          Протокол описания (Findings):
        </h2>
        <div className="text-xs text-slate-800 text-justify leading-relaxed whitespace-pre-wrap font-serif">
          {findingsText}
        </div>
      </div>

      {/* Impression */}
      <div className="mb-8 p-4 bg-slate-100 border-l-4 border-slate-800 rounded">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
          Заключение (Impression):
        </h2>
        <p className="text-xs font-bold text-slate-900 leading-relaxed font-serif">
          {currentCase.impression}
        </p>
        {currentCase.recommendations && (
          <p className="text-xs text-slate-700 mt-2 font-serif">
            <strong>Рекомендации:</strong> {currentCase.recommendations}
          </p>
        )}
        <p className="text-[11px] text-slate-600 font-mono mt-2">
          {currentCase.icdCode} {currentCase.biradsOrRadlex ? `· ${currentCase.biradsOrRadlex}` : ''}
        </p>
      </div>

      {/* Digital Signature & Stamp Footer */}
      <div className="mt-12 pt-4 border-t-2 border-slate-900 flex justify-between items-end">
        <div>
          <div className="text-xs font-bold text-slate-900">
            Врач-рентгенолог: {signatureData.doctorName}
          </div>
          <div className="text-[11px] text-slate-600">
            {signatureData.doctorRole}
          </div>
          {signatureData.isSigned ? (
            <div className="mt-2 text-[10px] font-mono text-emerald-800 border border-emerald-600 p-1.5 rounded bg-emerald-50">
              ✓ Документ подписан усиленной квалифицированной ЭЦП (ГОСТ Р 34.10-2012)
              <br />
              Владелец: {signatureData.doctorName} · Сертификат: {signatureData.certNumber} · {signatureData.timestamp}
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-amber-700 italic">
              * Документ сформирован системой WaspMed Draft и ожидает электронной подписи врача.
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="w-20 h-20 border border-slate-400 p-1 inline-flex flex-col items-center justify-center text-[9px] font-mono text-slate-500">
            [QR-Code Verification]
          </div>
        </div>
      </div>
    </div>
  );
};
