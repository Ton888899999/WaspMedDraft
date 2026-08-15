'use client';

import React from 'react';
import { Activity, UserCheck, Sparkles, Wifi } from 'lucide-react';

interface HeaderProps {
  doctorName?: string;
  doctorRole?: string;
  hospitalName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  doctorName = 'Dr. A. Karimov',
  doctorRole = 'Радиолог',
  hospitalName = 'Отделение лучевой диагностики',
}) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#111827] border-b border-[#1E293B] sticky top-0 z-50">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00D2FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,102,255,0.4)] text-white">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#94A3B8]">
            WaspMed Draft
          </h1>
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">
            AI Co-pilot for Radiologists
          </p>
        </div>
      </div>

      {/* Right side stats and doctor profile */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Live Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#10B981]/10 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]" />
          <span className="text-[11px] font-semibold text-[#10B981] whitespace-nowrap">
            PACS CONNECTED (LIVE)
          </span>
        </div>

        {/* Doctor Profile */}
        <div className="flex items-center gap-3 border-l border-[#1E293B] pl-3 sm:pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[#E5E7EB]">{doctorName}</p>
            <p className="text-[10px] text-[#94A3B8]">{doctorRole}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center overflow-hidden text-[#94A3B8]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

