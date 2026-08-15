'use client';

import React, { useRef } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { CaseData } from '@/lib/types';

interface CaseSelectorProps {
  cases: CaseData[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onCustomUpload: (file: File) => void;
  uploadedFileName?: string | null;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onCustomUpload,
  uploadedFileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onCustomUpload(files[0]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cases.map((c) => {
        const isSelected = selectedCaseId === c.id;
        return (
          <div
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className={`p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
              isSelected
                ? 'border-2 border-[#0066FF] bg-[#111827] shadow-[0_0_15px_rgba(0,102,255,0.2)]'
                : 'border border-[#1E293B] bg-[#111827] hover:bg-[#1E293B] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {c.isPathology ? (
                <>
                  <div className="p-1 bg-[#EF4444]/10 rounded">
                    <svg className="w-3 h-3 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-[#EF4444] font-bold tracking-wider">
                    PATHOLOGY
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-[#10B981]/10 rounded">
                    <svg className="w-3 h-3 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-[#10B981] font-bold tracking-wider">
                    NORMAL
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] font-semibold truncate text-[#E5E7EB]">
              {c.title}
            </p>
            <p className="text-[10px] text-[#94A3B8] truncate mt-0.5 font-mono">
              {c.modality.split(' ')[0]} · {c.totalSlices} ср.
            </p>
          </div>
        );
      })}

      {/* Upload DICOM Button */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".dcm,.dicom,.jpg,.jpeg,.png,.nii,.zip"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl border border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 h-full min-h-[64px] ${
            selectedCaseId === 'custom-upload'
              ? 'border-[#0066FF] bg-[#111827] shadow-[0_0_15px_rgba(0,102,255,0.2)]'
              : 'border-[#334155] bg-transparent hover:border-[#0066FF] hover:bg-[#111827]/40'
          }`}
        >
          <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-[9px] font-bold text-[#94A3B8] tracking-wider uppercase">
            {uploadedFileName ? (
              <span className="text-[#00D2FF] truncate max-w-[100px] inline-block">
                {uploadedFileName}
              </span>
            ) : (
              'ZIP · DICOM'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

