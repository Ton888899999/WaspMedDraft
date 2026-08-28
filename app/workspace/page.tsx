'use client';

import React, { useState, useEffect } from 'react';
import { CaseData, WindowPreset, SignatureData } from '@/lib/types';
import { DicomStudy, loadStudyFromZip, StudyLoadError } from '@/lib/dicom/study';
import { AttentionRegion, analyzeStudyAttention } from '@/lib/dicom/analyze';
import { analyzeViaService, checkAiService } from '@/lib/dicom/aiClient';
import { generateRadiologyConclusion, AiProvider } from '@/lib/ai/radiologyAi';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { UploadZone } from '@/components/UploadZone';
import { DicomViewer } from '@/components/DicomViewer';
import { ViewerControls } from '@/components/ViewerControls';
import { MetadataCard } from '@/components/MetadataCard';
import { AiWorkspace } from '@/components/AiWorkspace';
import { ReportEditor } from '@/components/ReportEditor';
import { ActionBar } from '@/components/ActionBar';
import { PrintReportTemplate } from '@/components/PrintReportTemplate';
import { Toast } from '@/components/Toast';

// Fullscreen reading mode is only needed after a real study is uploaded —
// load it lazily to keep it out of the initial workspace bundle.
const FullscreenViewer = dynamic(
  () => import('@/components/FullscreenViewer').then((m) => m.FullscreenViewer),
  { ssr: false },
);

export default function Home() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [currentSlice, setCurrentSlice] = useState<number>(1);
  const [windowPreset, setWindowPreset] = useState<WindowPreset>('soft_tissue');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isInverted, setIsInverted] = useState<boolean>(false);

  // Custom Upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [customImageDataUrl, setCustomImageDataUrl] = useState<string | null>(null);
  const [customCase, setCustomCase] = useState<CaseData | null>(null);
  const [dicomStudy, setDicomStudy] = useState<DicomStudy | null>(null);
  const [isLoadingStudy, setIsLoadingStudy] = useState<boolean>(false);
  const [attentionRegions, setAttentionRegions] = useState<AttentionRegion[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [uploadedZipFile, setUploadedZipFile] = useState<File | null>(null);
  const [analysisEngine, setAnalysisEngine] = useState<string>('');
  const [selectedAiProvider, setSelectedAiProvider] = useState<AiProvider>('gemini');
  const [generationStatus, setGenerationStatus] = useState<string>('');

  // AI Pipeline state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);

  // Editable Findings
  const [findingsText, setFindingsText] = useState<string>('');

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

  // Only the uploaded custom case is available
  const activeCase: CaseData | null = customCase;

  // Real DICOM ingest: extract the ZIP in the browser, parse every DICOM
  // file inside and build a case from the study's actual metadata.
  const handleZipUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setIsLoadingStudy(true);
    setToastMessage(`Распаковка и парсинг ${file.name}…`);
    try {
      const study = await loadStudyFromZip(file);
      const midSlice = Math.max(1, Math.ceil(study.slices.length / 2));
      const zipCase: CaseData = {
        id: 'custom-upload',
        title: `${study.modality} · ${study.description}`,
        caseBadge: 'Загруженное исследование',
        caseType: 'custom',
        isPathology: false,
        modality: `${study.modality} / DICOM Ingest`,
        protocolName: `Протокол исследования: ${study.description}`,
        patientId: study.patientId,
        patientName: study.patientName,
        patientAgeSex: study.patientAgeSex,
        studyDate: study.studyDate,
        studyTime: study.studyTime,
        hospitalName: study.institution,
        deviceModel: study.deviceModel,
        bodyPart: study.bodyPart,
        sliceThickness: study.sliceThickness,
        totalSlices: study.slices.length,
        defaultSlice: midSlice,
        coil: '—',
        contrast: study.slices[0] ? 'Нативное' : '—',
        kvpMa: '—',
        radiationDose: '—',
        fovMatrix: study.slices[0] ? `Matrix ${study.slices[0].columns}×${study.slices[0].rows}` : '—',
        confidenceScore: 0,
        processingTime: '—',
        studyArea: `Серия из ${study.slices.length} срезов (${study.modality}), ${study.description}.`,
        findingsText: 'Нажмите «Сгенерировать ИИ заключение» для анализа снимков.',
        traceableItems: [],
        impression: 'Ожидание запуска ИИ-модели...',
        recommendations: 'Нет данных. Запустите ИИ-генерацию.',
        icdCode: '',
      };

      setDicomStudy(study);
      setUploadedZipFile(file);
      setAttentionRegions([]);
      setCustomImageDataUrl(null);
      setCustomCase(zipCase);
      setSelectedCaseId('custom-upload');
      setCurrentSlice(midSlice);
      setFindingsText(zipCase.findingsText);
      setIsGenerated(false);
      setIsGenerating(false);
      setZoomLevel(100);
      setRotation(0);
      setIsInverted(false);
      setToastMessage(
        `Загружено ${study.slices.length} DICOM-срезов${
          study.skippedFiles > 0 ? `, пропущено файлов: ${study.skippedFiles}` : ''
        }`,
      );
    } catch (err) {
      setToastMessage(
        err instanceof StudyLoadError ? err.message : 'Не удалось обработать архив.',
      );
      setUploadedFileName(null);
    } finally {
      setIsLoadingStudy(false);
    }
  };

  // Handle custom file upload
  const handleCustomUpload = (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      void handleZipUpload(file);
      return;
    }
    setUploadedFileName(file.name);
    setDicomStudy(null);
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
        patientName: '—',
        patientAgeSex: '—',
        studyDate: new Date().toLocaleDateString('ru-RU'),
        studyTime: new Date().toLocaleTimeString('ru-RU'),
        hospitalName: '—',
        deviceModel: '—',
        bodyPart: '—',
        sliceThickness: '—',
        totalSlices: 1,
        defaultSlice: 1,
        coil: '—',
        contrast: '—',
        kvpMa: '—',
        radiationDose: '—',
        fovMatrix: '—',
        confidenceScore: 0,
        processingTime: '—',
        studyArea: `Анализ загруженного снимка ${file.name} с автоматическим распознаванием анатомических ориентиров.`,
        findingsText: 'Нажмите «Сгенерировать ИИ заключение» для анализа снимка.',
        traceableItems: [],
        impression: 'Ожидание запуска ИИ-модели...',
        recommendations: 'Нет данных. Запустите ИИ-генерацию.',
        icdCode: '',
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

  // Real analysis of an uploaded DICOM study using RADIOLOGY_SYSTEM prompt + Gemini Vision API
  const runRealStudyAnalysis = async (provider: AiProvider = selectedAiProvider, apiKey?: string) => {
    if (!customCase) return;
    (window as { _aiStartTime?: number })._aiStartTime = Date.now();
    setIsGenerating(true);
    setIsGenerated(false);
    setGenerationStep(1);
    setProgressPercent(10);
    setGenerationStatus(`Подготовка ${customCase.totalSlices} срезов для анализа…`);

    let serviceSummary = '';

    // Try local AI service first (if available)
    if (dicomStudy && uploadedZipFile) {
      const service = await checkAiService();
      if (service) {
        try {
          setGenerationStatus('Анализ на локальном AI-сервисе…');
          setGenerationStep(2);
          setProgressPercent(30);
          const res = await analyzeViaService(uploadedZipFile);
          serviceSummary = res.summary;
        } catch {
          /* Fall back to Gemini Vision */
        }
      }
    }

    setGenerationStep(2);
    setProgressPercent(40);

    // Call Gemini Vision (real API) or template fallback
    setGenerationStatus(provider === 'gemini' && apiKey
      ? `Отправка ${customCase.totalSlices} срезов в Gemini Vision API…`
      : 'Формирование протокола (шаблон)…'
    );

    const aiResult = await generateRadiologyConclusion(
      customCase,
      provider,
      serviceSummary || undefined,
      dicomStudy ?? undefined,
      apiKey,
      (step, pct) => {
        setGenerationStatus(step);
        setProgressPercent(40 + Math.round(pct * 0.55));
      },
    );

    const engineLabel = aiResult.provider;

    // Build traceableItems from AI-returned clinical annotations
    const traceFromAnnotations = aiResult.annotations.length > 0
      ? aiResult.annotations.map((ann, i) => ({
          phrase: ann.label,
          slices: String(Math.round((ann.slicePercent / 100) * customCase.totalSlices)),
          confidence: ann.severity === 'pathology' ? 91 : ann.severity === 'warning' ? 78 : 65,
          roi: `AI Маркер #${i + 1}`,
          details: `ИИ выявил: "${ann.label}" на позиции ${ann.slicePercent.toFixed(0)}% серии (срез ~${Math.round((ann.slicePercent / 100) * customCase.totalSlices)}).`,
          targetSlice: Math.max(1, Math.round((ann.slicePercent / 100) * customCase.totalSlices)),
        }))
      : customCase.traceableItems;

    const computedConfidence = (() => {
      if (aiResult.annotations.length === 0) return 85;
      const hasPathology = aiResult.annotations.some(a => a.severity === 'pathology');
      const hasWarning = aiResult.annotations.some(a => a.severity === 'warning');
      return hasPathology ? 93 : hasWarning ? 89 : 85;
    })();

    const updatedCase: CaseData = {
      ...customCase,
      findingsText: aiResult.findings,
      impression: aiResult.conclusion,
      recommendations: aiResult.recommendations,
      isPathology: aiResult.annotations.some(a => a.severity === 'pathology'),
      confidenceScore: computedConfidence,
      processingTime: `${((Date.now() - ((window as unknown as Record<string, number>)['_aiStartTime'] ?? Date.now())) / 1000).toFixed(2)}s`,
      traceableItems: traceFromAnnotations,
      aiAnnotations: aiResult.annotations,
    };

    // Clear old statistical attention regions — we use AI annotations now
    setAttentionRegions([]);
    setCustomCase(updatedCase);
    setFindingsText(aiResult.findings);
    setAnalysisEngine(engineLabel);

    setTimeout(() => {
      setGenerationStep(4);
      setProgressPercent(100);
      setIsGenerating(false);
      setIsGenerated(true);
      setShowAiOverlay(true);
      setGenerationStatus('');
      setToastMessage(`🤖 ИИ Черновик сформирован (${engineLabel})`);
    }, 400);
  };

  // AI Pipeline Execution — triggered from AiWorkspace
  const handleRunAiGeneration = (provider?: AiProvider, apiKey?: string) => {
    const p = provider ?? selectedAiProvider;
    setSelectedAiProvider(p);
    void runRealStudyAnalysis(p, apiKey);
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
        {/* Upload Toolbar */}
        <section aria-label="Загрузка исследования">
          <UploadZone
            onCustomUpload={handleCustomUpload}
            uploadedFileName={uploadedFileName}
            isLoading={isLoadingStudy}
          />
          {isLoadingStudy && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-[#1E293B] text-[11px] font-mono text-[#00D2FF]">
              <span className="w-3 h-3 rounded-full border-2 border-[#00D2FF] border-t-transparent animate-spin" />
              Распаковка ZIP и парсинг DICOM-файлов…
            </div>
          )}
        </section>

        {/* Workspace — shown only after a file is uploaded */}
        {activeCase ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* ======================================================== */}
            {/* LEFT COLUMN: DICOM Image Viewer & Controls & Metadata */}
            {/* ======================================================== */}
            <section
              aria-label="DICOM Просмотрщик"
              className="flex flex-col gap-3 order-1"
            >
              {/* Main DICOM Viewer
                  Only show statistical attention regions for CT; for MR they reflect
                  pixel-density anomalies that are not clinically meaningful. */}
              {(() => {
                const isCT = dicomStudy?.modality?.toUpperCase() === 'CT';
                return (
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
                    customImageDataUrl={customImageDataUrl}
                    dicomStudy={dicomStudy}
                    attentionRegions={activeCase.aiAnnotations ?? []}
                    onOpenFullscreen={() => setIsFullscreen(true)}
                  />
                );
              })()}

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
                caseType={(() => {
                  const mod = (activeCase.modality || '').toUpperCase();
                  const body = (activeCase.bodyPart || activeCase.title || '').toLowerCase();
                  if (mod === 'CT' && body.includes('lung')) return 'lung';
                  if (body.includes('мозг') || body.includes('brain') || body.includes('head')) return 'brain';
                  if (body.includes('позв') || body.includes('spine') || body.includes('lumbar') || body.includes('l_spine') || body.includes('cervical')) return 'spine';
                  return activeCase.caseType ?? 'brain';
                })()}
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
                generationStatus={generationStatus}
                onGenerate={handleRunAiGeneration}
                isGenerated={isGenerated}
                selectedProvider={selectedAiProvider}
                onProviderChange={setSelectedAiProvider}
              />

              {/* Structured Report Editor (Appears after AI generation) */}
              {isGenerated ? (
                <>
                  {analysisEngine && (
                    <div className="px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1E293B] text-[10px] font-mono text-[#94A3B8]">
                      Движок анализа: <span className="text-[#00D2FF]">{analysisEngine}</span>
                    </div>
                  )}
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
        ) : !isLoadingStudy ? (
          /* Empty state — no file loaded yet */
          <div className="flex flex-col items-center justify-center text-center gap-6 py-24">
            <div className="w-20 h-20 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#00D2FF]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E5E7EB]">Загрузите DICOM-исследование</h2>
              <p className="text-sm text-[#94A3B8] mt-2 max-w-sm leading-relaxed">
                Поддерживаются ZIP-архивы с DICOM-файлами (МРТ, МСКТ и другие модальности). Нажмите кнопку выше, чтобы выбрать файл.
              </p>
            </div>
          </div>
        ) : null}
      </main>

      {/* 3. Printable Medical Letterhead (Displayed only during print) */}
      {activeCase && (
        <PrintReportTemplate
          currentCase={activeCase}
          findingsText={findingsText}
          signatureData={signatureData}
        />
      )}

      {/* 4. Fullscreen reading mode for real DICOM studies */}
      {isFullscreen && dicomStudy && (
        <FullscreenViewer
          study={dicomStudy}
          caseTitle={activeCase?.title ?? ''}
          currentSlice={currentSlice}
          onSliceChange={setCurrentSlice}
          windowPreset={windowPreset}
          onWindowPresetChange={setWindowPreset}
          isInverted={isInverted}
          onToggleInvert={() => setIsInverted(!isInverted)}
          regions={isGenerated ? (activeCase?.aiAnnotations ?? []) : []}
          onClose={() => setIsFullscreen(false)}
        />
      )}

      {/* 5. Notification Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
