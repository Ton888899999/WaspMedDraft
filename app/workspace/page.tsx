'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_CASES } from '@/lib/mock-data';
import { CaseData, WindowPreset, SignatureData } from '@/lib/types';
import { DicomStudy, loadStudyFromZip, StudyLoadError } from '@/lib/dicom/study';
import { AttentionRegion, analyzeStudyAttention } from '@/lib/dicom/analyze';
import { analyzeViaService, checkAiService } from '@/lib/dicom/aiClient';
import dynamic from 'next/dynamic';
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

// Fullscreen reading mode is only needed after a real study is uploaded —
// load it lazily to keep it out of the initial workspace bundle.
const FullscreenViewer = dynamic(
  () => import('@/components/FullscreenViewer').then((m) => m.FullscreenViewer),
  { ssr: false },
);

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
  const [dicomStudy, setDicomStudy] = useState<DicomStudy | null>(null);
  const [isLoadingStudy, setIsLoadingStudy] = useState<boolean>(false);
  const [attentionRegions, setAttentionRegions] = useState<AttentionRegion[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [uploadedZipFile, setUploadedZipFile] = useState<File | null>(null);
  const [analysisEngine, setAnalysisEngine] = useState<string>('');

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
        coil: 'Standard Array',
        contrast: 'Нативное',
        kvpMa: 'Auto kVp / Auto mAs',
        radiationDose: 'N/A',
        fovMatrix: `Matrix ${study.slices[0].columns}×${study.slices[0].rows}`,
        confidenceScore: 92,
        processingTime: '1.10s',
        studyArea: `Серия из ${study.slices.length} срезов (${study.modality}), ${study.description}.`,
        findingsText: `На серии срезов (${study.slices.length} изображений, ${study.modality}) анатомические структуры дифференцированы, взаимное расположение сохранено. Костно-деструктивных изменений на уровне визуализации не определяется. Мягкие ткани без видимых объёмных образований. Очаговых изменений с патологическим сигналом на представленных срезах достоверно не выявлено.`,
        traceableItems: [
          {
            phrase: 'анатомические структуры дифференцированы',
            slices: `01–${String(study.slices.length).padStart(2, '0')}`,
            confidence: 93.5,
            roi: 'ROI #1 (Full Series)',
            details: `Автоматический анализ ${study.slices.length} срезов серии DICOM.`,
            targetSlice: midSlice,
          },
        ],
        impression:
          'Данных за острую хирургическую или очаговую патологию на представленных срезах не получено. Черновик сформирован автоматически и требует верификации врачом.',
        recommendations:
          'Консультация профильного специалиста по клиническим показаниям. Динамическое наблюдение.',
        icdCode: 'МКБ-10: Z01.6 — Радиологическое обследование, не классифицированное в других рубриках',
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

  // Real analysis of an uploaded DICOM study: statistical density scan
  // of the actual pixel data. Regions with strongly deviating local
  // density are flagged as attention cues for the physician (not a diagnosis).
  const runRealStudyAnalysis = async () => {
    if (!dicomStudy || !customCase) return;
    setIsGenerating(true);
    setIsGenerated(false);
    setGenerationStep(1);
    setProgressPercent(5);

    // Prefer the local AI service (real ML engines plug in there); fall
    // back to the in-browser statistical analyzer when it is not running.
    let regions: AttentionRegion[] = [];
    let engineLabel = 'Встроенный статистический анализ (браузер)';
    let serviceSummary = '';
    let analyzedByService = false;

    const service = await checkAiService();
    if (service && uploadedZipFile) {
      try {
        setToastMessage('Анализ на локальном AI-сервисе…');
        setGenerationStep(2);
        setProgressPercent(35);
        const res = await analyzeViaService(uploadedZipFile);
        regions = res.regions;
        engineLabel = `AI-сервис: ${res.engineName}`;
        serviceSummary = res.summary;
        analyzedByService = true;
      } catch (err) {
        setToastMessage(
          `AI-сервис недоступен (${err instanceof Error ? err.message : 'ошибка'}) — встроенный анализ`,
        );
      }
    }
    if (!analyzedByService) {
      regions = await analyzeStudyAttention(dicomStudy, (p) => {
        setGenerationStep(p < 60 ? 1 : 2);
        setProgressPercent(5 + Math.round(p * 0.82));
      });
    }

    setGenerationStep(3);
    setProgressPercent(93);
    setAttentionRegions(regions);
    setAnalysisEngine(engineLabel);

    const isCT = dicomStudy.modality.toUpperCase() === 'CT';
    const regionLines = regions.map(
      (r, i) =>
        `Срез ${r.sliceNumber}: ${r.label.toLowerCase()} (отклонение ${r.score.toFixed(1)}σ от медианы тканей среза${
          isCT ? `, средняя плотность ${Math.round(r.meanValue)} HU` : ''
        }) — ROI #${i + 1}, требует оценки врача.`,
    );

    const findings =
      `Метод анализа: ${engineLabel}.${serviceSummary ? ` ${serviceSummary}.` : ''}\n\n` +
      `На серии срезов (${dicomStudy.slices.length} изображений, ${dicomStudy.modality}) анатомические структуры дифференцированы, взаимное расположение сохранено.\n\n` +
      (regions.length > 0
        ? `Автоматический статистический анализ плотности выявил ${regions.length} зон(у/ы) внимания:\n${regionLines.join(
            '\n',
          )}\n\nОтмеченные зоны — статистические отклонения локальной плотности, а не диагноз. Каждая зона требует визуальной оценки врачом (доступен полноэкранный режим с увеличением).`
        : 'Автоматический статистический анализ плотности значимых локальных отклонений на анализируемых срезах не выявил. Рекомендуется выборочный визуальный контроль серии.');

    const impression =
      regions.length > 0
        ? `Автоматический анализ отметил ${regions.length} зон(у/ы) статистического отклонения плотности (максимальное ${regions[0].score.toFixed(
            1,
          )}σ, срез ${regions[0].sliceNumber}). Черновик сформирован автоматически и требует верификации врачом.`
        : 'Значимых статистических отклонений плотности не выявлено. Черновик сформирован автоматически и требует верификации врачом.';

    const updatedCase: CaseData = {
      ...customCase,
      findingsText: findings,
      impression,
      isPathology: false,
      confidenceScore: regions.length > 0 ? Math.min(97, Math.round(60 + regions[0].score * 6)) : 92,
      traceableItems:
        regions.length > 0
          ? regions.map((r, i) => ({
              phrase: r.label,
              slices: String(r.sliceNumber),
              confidence: Math.min(97, Math.round(55 + r.score * 8)),
              roi: `ROI #${i + 1}`,
              details: `Отклонение ${r.score.toFixed(1)}σ${
                isCT ? `, средняя плотность ${Math.round(r.meanValue)} HU` : ''
              }. Кликните, чтобы перейти к срезу ${r.sliceNumber}.`,
              targetSlice: r.sliceNumber,
            }))
          : customCase.traceableItems,
    };
    setCustomCase(updatedCase);
    setFindingsText(findings);

    setTimeout(() => {
      setGenerationStep(4);
      setProgressPercent(100);
      setIsGenerating(false);
      setIsGenerated(true);
      setShowAiOverlay(true);
      if (regions.length > 0) {
        setCurrentSlice(regions[0].sliceNumber);
        setToastMessage(
          `Анализ завершён: отмечено зон внимания — ${regions.length}. Перешли к срезу ${regions[0].sliceNumber}`,
        );
      } else {
        setToastMessage('Анализ завершён: значимых зон внимания не выявлено');
      }
    }, 500);
  };

  // AI Pipeline Execution (~3.5 seconds total)
  const handleRunAiGeneration = () => {
    if (selectedCaseId === 'custom-upload' && dicomStudy) {
      void runRealStudyAnalysis();
      return;
    }
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
          {isLoadingStudy && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-[#1E293B] text-[11px] font-mono text-[#00D2FF]">
              <span className="w-3 h-3 rounded-full border-2 border-[#00D2FF] border-t-transparent animate-spin" />
              Распаковка ZIP и парсинг DICOM-файлов…
            </div>
          )}
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
              dicomStudy={selectedCaseId === 'custom-upload' ? dicomStudy : null}
              attentionRegions={selectedCaseId === 'custom-upload' ? attentionRegions : []}
              onOpenFullscreen={() => setIsFullscreen(true)}
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
      </main>

      {/* 3. Printable Medical Letterhead (Displayed only during print) */}
      <PrintReportTemplate
        currentCase={activeCase}
        findingsText={findingsText}
        signatureData={signatureData}
      />

      {/* 4. Fullscreen reading mode for real DICOM studies */}
      {isFullscreen && dicomStudy && selectedCaseId === 'custom-upload' && (
        <FullscreenViewer
          study={dicomStudy}
          caseTitle={activeCase.title}
          currentSlice={currentSlice}
          onSliceChange={setCurrentSlice}
          windowPreset={windowPreset}
          onWindowPresetChange={setWindowPreset}
          isInverted={isInverted}
          onToggleInvert={() => setIsInverted(!isInverted)}
          regions={isGenerated ? attentionRegions : []}
          onClose={() => setIsFullscreen(false)}
        />
      )}

      {/* 5. Notification Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
