'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_CASES } from '@/lib/mock-data';
import { CaseData, WindowPreset, SignatureData } from '@/lib/types';
import { Header } from '@/components/Header';
import { CaseSelector } from '@/components/CaseSelector';
import { DicomViewer } from '@/components/DicomViewer';
import { ViewerControls } from '@/components/ViewerControls';
import { MetadataCard } from '@/components/MetadataCard';
import { AiWorkspace } from '@/components/AiWorkspace';
import { ReportEditor } from '@/components/ReportEditor';
import { ActionBar } from '@/components/ActionBar';
import { PrintReportTemplate } from '@/components/PrintReportTemplate';
import { Toast } from '@/components/Toast';

export default function Home() {
  const [cases] = useState<CaseData[]>(MOCK_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(MOCK_CASES[0].id);
  const [currentSlice, setCurrentSlice] = useState<number>(MOCK_CASES[0].defaultSlice);
  const [windowPreset, setWindowPreset] = useState<WindowPreset>('soft_tissue');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isInverted, setIsInverted] = useState<boolean>(false);

  // Custom Upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [customImageDataUrl, setCustomImageDataUrl] = useState<string | null>(null);
  const [customCase, setCustomCase] = useState<CaseData | null>(null);

  // AI Pipeline state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);

  // Editable Findings
  const [findingsText, setFindingsText] = useState<string>(MOCK_CASES[0].findingsText);

  // Digital Signature state
  const [signatureData, setSignatureData] = useState<SignatureData>({
    isSigned: false,
    doctorName: 'Dr. A. Karimov',
    doctorRole: 'Врач-рентгенолог высшей категории',
    timestamp: null,
    certNumber: '04FA 9128 BC45 8891 0021',
    cryptoAlg: 'ГОСТ Р 34.10-2012 (256-bit)',
    hash: 'e89f47a1...b2c9',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCase: CaseData =
    selectedCaseId === 'custom-upload' && customCase
      ? customCase
      : cases.find((c) => c.id === selectedCaseId) || cases[0];

  // When switching cases, reset viewing parameters & draft state
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    const targetCase = cases.find((c) => c.id === caseId) || cases[0];
    setCurrentSlice(targetCase.defaultSlice);
    setFindingsText(targetCase.findingsText);
    setWindowPreset(targetCase.caseType === 'lung' ? 'lung' : 'soft_tissue');
    setZoomLevel(100);
    setRotation(0);
    setIsInverted(false);
    setIsGenerated(false);
    setIsGenerating(false);
    setGenerationStep(0);
    setProgressPercent(0);
    setShowAiOverlay(true);
    setSignatureData((prev) => ({
      ...prev,
      isSigned: false,
      timestamp: null,
    }));
  };

  // Handle custom file upload
  const handleCustomUpload = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCustomImageDataUrl(dataUrl);

      const newCustomCase: CaseData = {
        id: 'custom-upload',
        title: `Загруженный снимок: ${file.name}`,
        caseBadge: 'Пользовательский снимок',
        caseType: 'custom',
        isPathology: false,
        modality: 'DICOM Ingest / Custom Scan',
        protocolName: `Протокол исследования: ${file.name}`,
        patientId: '#Custom-Upload',
        patientName: 'Анонимизированный пациент',
        patientAgeSex: '—',
        studyDate: '14.08.2026',
        studyTime: new Date().toLocaleTimeString('ru-RU'),
        hospitalName: 'Отделение лучевой диагностики',
        deviceModel: 'DICOM 3.0 Compatible Ingest',
        bodyPart: 'Пользовательская область',
        sliceThickness: '1.0 mm',
        totalSlices: 20,
        defaultSlice: 10,
        coil: 'Standard Array',
        contrast: 'Нативное',
        kvpMa: 'Auto kVp / Auto mAs',
        radiationDose: 'N/A',
        fovMatrix: 'FOV 250mm / Matrix 512×512',
        confidenceScore: 92,
        processingTime: '1.10s',
        studyArea: `Анализ загруженного снимка ${file.name} с автоматическим распознаванием анатомических ориентиров.`,
        findingsText:
          'На представленном срезе анатомические структуры дифференцированы. Грубых деструктивных изменений костных структур и видимых патологических объемов не определяется. Рекомендуется сопоставление с полным объемом серии DICOM-сканирования.',
        traceableItems: [
          {
            phrase: 'анатомические структуры дифференцированы',
            slices: '01–20',
            confidence: 93.5,
            roi: 'ROI #1 (Custom ROI)',
            details: 'Базовый авто-анализ DICOM структуры.',
            targetSlice: 10,
          },
        ],
        impression:
          'На представленном изолированном снимке данных за острую хирургическую или очаговую патологию не получено.',
        recommendations: 'Рекомендуется предоставление полной серии томограмм.',
        icdCode: 'МКБ-10: R93.8 — Другие уточненные аномальные результаты диагностического исследования',
      };

      setCustomCase(newCustomCase);
      setSelectedCaseId('custom-upload');
      setCurrentSlice(10);
      setFindingsText(newCustomCase.findingsText);
      setIsGenerated(false);
      setToastMessage(`Файл ${file.name} успешно принят в обработку (симуляция DICOM-ингеста)`);
    };
    reader.readAsDataURL(file);
  };

  // AI Pipeline Execution (~3.5 seconds total)
  const handleRunAiGeneration = () => {
    setIsGenerating(true);
    setIsGenerated(false);
    setGenerationStep(1);
    setProgressPercent(15);

    // Step 1 -> Step 2 after 1100ms
    setTimeout(() => {
      setGenerationStep(2);
      setProgressPercent(55);
    }, 1100);

    // Step 2 -> Step 3 after 2300ms
    setTimeout(() => {
      setGenerationStep(3);
      setProgressPercent(88);
    }, 2300);

    // Step 3 -> Completed after 3400ms
    setTimeout(() => {
      setGenerationStep(4);
      setProgressPercent(100);
      setIsGenerating(false);
      setIsGenerated(true);
      setShowAiOverlay(true);
      setToastMessage('Черновик медицинского протокола успешно сгенерирован ИИ');
    }, 3400);
  };

  // Handle Doctor Digital Signing
  const handleSignReport = () => {
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    setSignatureData((prev) => ({
      ...prev,
      isSigned: true,
      timestamp: formattedTime,
    }));
  };

  // Reset view parameters
  const handleResetView = () => {
    setZoomLevel(100);
    setRotation(0);
    setIsInverted(false);
    setToastMessage('Параметры отображения сброшены');
  };

  // Jump to slice from traceability tag
  const handleJumpToSlice = (slice: number) => {
    setCurrentSlice(slice);
    setToastMessage(`Переход к срезу #${slice}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E5E7EB] flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 1. Header (Sticky) */}
      <Header />

      {/* 2. Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4 print:hidden">
        {/* Case Selector Toolbar */}
        <section aria-label="Выбор клинического кейса">
          <CaseSelector
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={handleSelectCase}
            onCustomUpload={handleCustomUpload}
            uploadedFileName={uploadedFileName}
          />
        </section>

        {/* 2-Column Responsive Radiology Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: DICOM Image Viewer & Controls & Metadata */}
          {/* ======================================================== */}
          <section
            aria-label="DICOM Просмотрщик"
            className="flex flex-col gap-3 order-1"
          >
            {/* Main DICOM Viewer */}
            <DicomViewer
              currentCase={activeCase}
              currentSlice={currentSlice}
              windowPreset={windowPreset}
              zoomLevel={zoomLevel}
              rotation={rotation}
              isInverted={isInverted}
              isAiGenerated={isGenerated}
              showAiOverlay={showAiOverlay}
              onToggleAiOverlay={() => setShowAiOverlay(!showAiOverlay)}
              onSliceChange={setCurrentSlice}
              customImageDataUrl={
                selectedCaseId === 'custom-upload' ? customImageDataUrl : null
              }
            />

            {/* Viewer Controls (Slice Slider, Windowing Tabs, Tools) */}
            <ViewerControls
              currentSlice={currentSlice}
              totalSlices={activeCase.totalSlices}
              onSliceChange={setCurrentSlice}
              windowPreset={windowPreset}
              onWindowPresetChange={setWindowPreset}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              rotation={rotation}
              onRotateChange={setRotation}
              isInverted={isInverted}
              onToggleInvert={() => setIsInverted(!isInverted)}
              onResetView={handleResetView}
              caseType={activeCase.caseType}
            />

            {/* DICOM Metadata Card */}
            <MetadataCard currentCase={activeCase} />
          </section>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: AI Clinical Workspace & Report Editor */}
          {/* ======================================================== */}
          <section
            aria-label="AI Клинический ассистент"
            className="flex flex-col gap-3 order-2"
          >
            {/* AI Generator Button & Inference Pipeline Progress */}
            <AiWorkspace
              currentCase={activeCase}
              isGenerating={isGenerating}
              generationStep={generationStep}
              progressPercent={progressPercent}
              onGenerate={handleRunAiGeneration}
              isGenerated={isGenerated}
            />

            {/* Structured Report Editor (Appears after AI generation) */}
            {isGenerated ? (
              <>
                <ReportEditor
                  currentCase={activeCase}
                  findingsText={findingsText}
                  onFindingsTextChange={setFindingsText}
                  onJumpToSlice={handleJumpToSlice}
                  signatureData={signatureData}
                  onRegenerate={handleRunAiGeneration}
                />

                {/* Action Bar */}
                <ActionBar
                  currentCase={activeCase}
                  findingsText={findingsText}
                  isGenerated={isGenerated}
                  signatureData={signatureData}
                  onSign={handleSignReport}
                  onShowToast={(msg) => setToastMessage(msg)}
                  onRegenerate={handleRunAiGeneration}
                />
              </>
            ) : !isGenerating ? (
              /* Idle Placeholder state before generation */
              <div className="p-8 rounded-xl bg-[#111827] border border-[#1E293B] border-dashed flex flex-col items-center justify-center text-center gap-3 min-h-[320px]">
                <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 text-[#00D2FF] border border-[#0066FF]/20 flex items-center justify-center">
                  <span className="text-xl">🩺</span>
                </div>
                <div className="max-w-md">
                  <h3 className="text-sm font-bold text-[#E5E7EB]">
                    Готов к анализу снимка
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                    Нажмите кнопку <strong className="text-[#00D2FF]">«Сгенерировать черновик протокола»</strong> выше, чтобы запустить автоматическую сегментацию срезов и формирование медицинского описания.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      {/* 3. Printable Medical Letterhead (Displayed only during print) */}
      <PrintReportTemplate
        currentCase={activeCase}
        findingsText={findingsText}
        signatureData={signatureData}
      />

      {/* 4. Notification Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
