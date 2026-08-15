'use client';

import React from 'react';
import { CaseData } from '@/lib/types';
import { FileText, Cpu, Radio, Shield, HardDrive } from 'lucide-react';

interface MetadataCardProps {
  currentCase: CaseData;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ currentCase }) => {
  return (
    <div className="p-3 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#E5E7EB]">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>DICOM Metadata & Acquisition Parameters</span>
        </div>
        <span className="text-[10px] font-mono text-[#64748B] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          UID: 1.2.840.10008.5.1.4.1.1
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]/60">
          <div className="text-[10px] text-[#64748B] uppercase">Пациент</div>
          <div className="text-[#E5E7EB] font-bold truncate">{currentCase.patientId}</div>
          <div className="text-[10px] text-[#94A3B8] truncate">{currentCase.patientAgeSex}</div>
        </div>

        <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]/60">
          <div className="text-[10px] text-[#64748B] uppercase">Модальность</div>
          <div className="text-cyan-400 font-bold truncate">{currentCase.modality.split(' ')[0]}</div>
          <div className="text-[10px] text-[#94A3B8] truncate">{currentCase.sliceThickness}</div>
        </div>

        <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]/60">
          <div className="text-[10px] text-[#64748B] uppercase">Томограф</div>
          <div className="text-[#E5E7EB] font-bold truncate">{currentCase.deviceModel.split(' ')[0]}</div>
          <div className="text-[10px] text-[#94A3B8] truncate">{currentCase.coil.split(' ')[0]}</div>
        </div>

        <div className="bg-[#0B0F17] p-2 rounded-lg border border-[#1E293B]/60">
          <div className="text-[10px] text-[#64748B] uppercase">Доза / Параметры</div>
          <div className="text-emerald-400 font-bold truncate">{currentCase.radiationDose.split(' ')[0]}</div>
          <div className="text-[10px] text-[#94A3B8] truncate">{currentCase.studyDate}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#64748B] px-1 pt-1">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-slate-500" /> {currentCase.deviceModel}
        </span>
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-slate-500" /> {currentCase.contrast}
        </span>
      </div>
    </div>
  );
};
