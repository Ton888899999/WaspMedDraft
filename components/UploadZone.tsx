'use client';

import React, { useRef, useState } from 'react';

interface UploadZoneProps {
  onCustomUpload: (file: File) => void;
  uploadedFileName?: string | null;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onCustomUpload,
  uploadedFileName,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onCustomUpload(files[0]);
      // reset so same file can be re-selected
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onCustomUpload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
        transition-all duration-200 select-none
        ${isDragging
          ? 'border-[#0066FF] bg-[#0066FF]/10 shadow-[0_0_20px_rgba(0,102,255,0.2)]'
          : uploadedFileName
            ? 'border-[#0066FF]/40 bg-[#111827] hover:border-[#0066FF] hover:bg-[#111827]'
            : 'border-dashed border-[#334155] bg-[#111827]/60 hover:border-[#0066FF]/60 hover:bg-[#111827]'
        }
        ${isLoading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".dcm,.dicom,.jpg,.jpeg,.png,.nii,.zip"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Icon */}
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
        ${uploadedFileName ? 'bg-[#0066FF]/10' : 'bg-[#1E293B]'}`}>
        {isLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-[#00D2FF] border-t-transparent animate-spin" />
        ) : uploadedFileName ? (
          <svg className="w-4 h-4 text-[#00D2FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {uploadedFileName ? (
          <>
            <p className="text-[11px] font-bold text-[#00D2FF] truncate">{uploadedFileName}</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Нажмите, чтобы загрузить другой файл</p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold text-[#94A3B8]">
              Загрузить ZIP / DICOM
            </p>
            <p className="text-[10px] text-[#475569] mt-0.5">
              Перетащите файл или нажмите для выбора · .zip, .dcm, .jpg, .png
            </p>
          </>
        )}
      </div>

      {/* Action hint */}
      <div className="shrink-0 px-2 py-1 rounded-md bg-[#0066FF]/10 border border-[#0066FF]/20">
        <span className="text-[9px] font-bold text-[#0066FF] tracking-wider uppercase">
          {uploadedFileName ? 'Заменить' : 'Открыть'}
        </span>
      </div>
    </div>
  );
};
