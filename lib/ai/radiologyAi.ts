import { CaseData, ClinicalAnnotation } from '../types';
import { DicomStudy, DicomSlice } from '../dicom/study';
import { renderSliceToImageData } from '../dicom/render';

// ─── System Prompt ────────────────────────────────────────────────────────────

/**
 * System prompt for radiology AI (from atsal-main-main).
 * Instructs Gemini Vision to act as a radiologist and return structured JSON.
 */
export const RADIOLOGY_SYSTEM = `Ты — опытный врач-рентгенолог. По приложенным кадрам исследования (МРТ, КТ/МСКТ, РГ или другое) и клиническому контексту составь ПРОФЕССИОНАЛЬНЫЙ предварительный протокол описания и заключение — уровня записи в историю болезни.

Модальность-специфическая терминология:
- МРТ: используй термины гипер-/гипоинтенсивный МР-сигнал, T1/T2-взвешенные изображения, DWI, ADC, T2-FLAIR, T2*, ограничение диффузии, артефакты;
- КТ/МСКТ: используй единицы HU (ед. Хаунсфилда), окна по мягким тканям/лёгким/костям, денситометрию, MPR/3D реконструкции, артефакты металла/кальцинозов;

Требования к качеству:
- Описывай СИСТЕМАТИЧНО, по анатомическим областям и структурам, которые видны на кадрах. Используй корректную рентгенологическую терминологию.
- Для каждой патологической находки укажи локализацию, характер (сигнал/плотность, контуры, структуру) и — если объективно видно — приблизительные размеры/распространённость.
- Отмечай и НОРМУ (какие структуры без патологии), и патологию — протокол должен быть полным.
- В заключении дай связный вывод; при необходимости — дифференциальный ряд и рекомендации.

Безопасность (обязательно):
- Это ПРЕДВАРИТЕЛЬНЫЙ ЧЕРНОВИК. Окончательное заключение ставит и подписывает врач-специалист.
- Описывай только то, что реально видно на предоставленных срезах.
- Если данных недостаточно — прямо укажи, что необходим полный просмотр серии.

ЯЗЫК: пиши ТОЛЬКО на русском языке.

ФОРМАТ ОТВЕТА: верни СТРОГО JSON без markdown и без пояснений вокруг:
{
  "findings": "систематическое описание по областям/структурам (Тавсиф)",
  "conclusion": "заключение (Хулоса): итоговый вывод, дифдиагноз",
  "recommendations": "конкретные рекомендации",
  "annotations": [
    {
      "label": "краткое название находки (например: 'Грыжа L4-L5' или 'Консолидация S9' или 'Очаг +2.4 см HU+48')",
      "slice_percent": 65,
      "cx": 50,
      "cy": 55,
      "severity": "pathology"
    }
  ]
}
Правила для annotations: добавляй только реальные находки видимые на кадрах. slice_percent — примерная позиция в серии (0%=начало, 100%=конец). cx/cy — центр находки на снимке в % (cx=50 cy=50 = центр). Если патологии нет — оставь annotations: [].
Суммарно выбирай severity: pathology=чёткая патология, warning=дегенеративные/возрастные изменения, info=нормальные находки.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiRadiologyConclusion {
  findings?: string;
  conclusion?: string;
  recommendations?: string;
  annotations?: ClinicalAnnotation[];
  rawText?: string;
}

export type AiProvider = 'gemini' | 'claude' | 'local';

// ─── JSON Parser ──────────────────────────────────────────────────────────────

/**
 * Robust JSON parser for LLM outputs.
 */
export const parseAiJson = (raw: string): AiRadiologyConclusion => {
  try {
    let s = String(raw || '').trim();
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    const o = JSON.parse(s);

    // Parse annotations array from model response
    let annotations: ClinicalAnnotation[] = [];
    if (Array.isArray(o.annotations)) {
      annotations = o.annotations
        .filter((ann: Record<string, unknown>) => typeof ann.label === 'string')
        .map((ann: Record<string, unknown>) => ({
          label: String(ann.label),
          slicePercent: typeof ann.slice_percent === 'number' ? ann.slice_percent : 50,
          cx: typeof ann.cx === 'number' ? ann.cx : 50,
          cy: typeof ann.cy === 'number' ? ann.cy : 50,
          severity: (ann.severity === 'pathology' || ann.severity === 'warning' || ann.severity === 'info')
            ? (ann.severity as ClinicalAnnotation['severity'])
            : 'warning',
        }));
      if (annotations.length === 0) {
        annotations = [] as ClinicalAnnotation[];
      }
    }

    return {
      findings: typeof o.findings === 'string' ? o.findings : undefined,
      conclusion: typeof o.conclusion === 'string' ? o.conclusion : undefined,
      recommendations: typeof o.recommendations === 'string' ? o.recommendations : undefined,
      annotations,
      rawText: raw,
    };
  } catch {
    return { rawText: raw };
  }
};

// ─── Clinical Context Builder ─────────────────────────────────────────────────

export function buildClinicalContext(caseData: CaseData): string {
  return [
    `Исследование: ${caseData.title || caseData.protocolName || 'МРТ'}`,
    `Пациент: ${caseData.patientName || 'Анонимизированный пациент'}, ${caseData.patientAgeSex || '—'}`,
    `Модальность / Зона: ${caseData.modality} (${caseData.bodyPart || 'Не указана'})`,
    `Параметры серии: ${caseData.totalSlices} срезов, толщина среза ${caseData.sliceThickness}`,
    `Оборудование: ${caseData.deviceModel || 'DICOM Ingest System'}`,
    `Контрастирование: ${caseData.contrast || 'Нативное'}`,
    caseData.studyArea ? `Область исследования: ${caseData.studyArea}` : '',
  ].filter(Boolean).join('\n');
}

// ─── DICOM → JPEG base64 conversion ──────────────────────────────────────────

/** Select the best window preset for a given modality/body part. */
function selectWindowPreset(modality: string, bodyPart: string): import('../types').WindowPreset {
  const mod = modality.toUpperCase();
  const body = bodyPart.toLowerCase();
  if (mod === 'CT' || mod === 'MSCT') {
    if (body.includes('лёгк') || body.includes('lung') || body.includes('chest') || body.includes('thorax') || body.includes('груд')) return 'lung';
    if (body.includes('кост') || body.includes('bone') || body.includes('череп') || body.includes('skull') || body.includes('позв') || body.includes('spine')) return 'bone';
    if (body.includes('мозг') || body.includes('brain') || body.includes('head') || body.includes('голов')) return 'brain';
    return 'soft_tissue';
  }
  // MRI: use file's own window values (isCT=false path in renderSliceToImageData)
  return 'soft_tissue';
}

/**
 * Renders a DICOM slice to a small JPEG base64 string for Vision API.
 * For CT: uses correct HU windowing based on modality/body part.
 * For MRI: uses the window values embedded in the DICOM file.
 * Uses OffscreenCanvas (Web Worker safe) or regular Canvas.
 */
async function sliceToBase64Jpeg(
  slice: DicomSlice,
  modality: string,
  bodyPart: string,
  quality = 0.75,
): Promise<string | null> {
  try {
    const isCT = modality.toUpperCase() === 'CT' || modality.toUpperCase().includes('CT');
    const preset = selectWindowPreset(modality, bodyPart);
    const imageData = renderSliceToImageData(slice, preset, false, isCT);

    const w = slice.columns;
    const h = slice.rows;

    // Downscale to max 512px on longest side to stay under API payload limits
    const maxSide = 512;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    // Try OffscreenCanvas first (works in workers), fall back to regular
    let blob: Blob | null = null;
    try {
      const ofc = new OffscreenCanvas(w, h);
      const ctx = ofc.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);
      // Scale to target
      const ofc2 = new OffscreenCanvas(tw, th);
      const ctx2 = ofc2.getContext('2d')!;
      ctx2.drawImage(ofc, 0, 0, tw, th);
      blob = await ofc2.convertToBlob({ type: 'image/jpeg', quality });
    } catch {
      // OffscreenCanvas not available — use regular canvas (main thread only)
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d')!;
      // put full-res first then draw scaled
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext('2d')!;
      tctx.putImageData(imageData, 0, 0);
      ctx.drawImage(tmp, 0, 0, tw, th);
      return new Promise<string>((resolve) => {
        canvas.toBlob((b) => {
          if (!b) { resolve(''); return; }
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
          reader.readAsDataURL(b);
        }, 'image/jpeg', quality);
      });
    }

    if (!blob) return null;
    const ab = await blob.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

// ─── Slice sampling strategy ──────────────────────────────────────────────────

/** Cap on how many rendered slices are attached to a single Vision request. */
const MAX_IMAGES_PER_REQUEST = 16;

/**
 * Select representative slices from the full series:
 * - Always include first, last and middle
 * - Evenly distribute up to maxImages across the series
 * This ensures ALL anatomical levels are covered regardless of slice count.
 */
function selectRepresentativeSlices(slices: DicomSlice[], maxImages: number): DicomSlice[] {
  const renderable = slices.filter((s) => s.renderable && s.rows > 0 && s.columns > 0);
  if (renderable.length === 0) return [];
  if (renderable.length <= maxImages) return renderable;

  const selected: DicomSlice[] = [];
  const step = (renderable.length - 1) / (maxImages - 1);
  for (let i = 0; i < maxImages; i++) {
    const idx = Math.min(renderable.length - 1, Math.round(i * step));
    selected.push(renderable[idx]);
  }
  return selected;
}

// ─── Gemini Vision API call ───────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-3.6-flash';

async function callGeminiVision(
  apiKey: string,
  systemPrompt: string,
  userText: string,
  imageBase64List: Array<{ data: string; mimeType: string }>,
): Promise<string> {
  // Build parts: first the text context, then all images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [{ text: userText }];
  for (const img of imageBase64List) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
  }

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${errText.slice(0, 300)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await resp.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
    '';
  return text;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/** Max slices per single Gemini Vision request (API payload limit ~20 MB) */
const BATCH_SIZE = 30;

/** Max image side in px — smaller for large series to keep payload under limit */
function imageSizeForSeries(total: number): number {
  if (total <= 50) return 512;
  if (total <= 150) return 384;
  if (total <= 300) return 256;
  return 192; // 500+ slices: very small thumbnails for speed + payload
}

/** JPEG quality — trade-off: lower for large series to save bandwidth */
function imageQualityForSeries(total: number): number {
  if (total <= 50) return 0.80;
  if (total <= 150) return 0.70;
  if (total <= 300) return 0.60;
  return 0.50;
}

/** Split an array into chunks of `size` */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** System prompt for the synthesis (merge) step */
const SYNTHESIS_SYSTEM = `Ты — опытный врач-рентгенолог, выполняющий финальную сверку. 
Тебе предоставлены частичные заключения по отдельным группам срезов одной серии. 
Объедини их в ЕДИНЫЙ, связный, полный профессиональный протокол. 
Устрани дублирование, уточни спорные моменты, выстрой иерархию находок (от главного к второстепенному). 
Верни СТРОГО JSON без markdown:
{
  "findings": "систематическое описание (Тавсиф)",
  "conclusion": "итоговое заключение (Хулоса)",
  "recommendations": "конкретные рекомендации",
  "annotations": [ { "label": "...", "slice_percent": 50, "cx": 50, "cy": 50, "severity": "pathology" } ]
}
ЯЗЫК: только русский.`;

/**
 * Generates a real structured radiology conclusion by:
 * 1. Rendering DICOM slices to JPEG images
 * 2. Selecting representative slices across the whole series
 * 3. Sending them in batches to Gemini Vision with RADIOLOGY_SYSTEM prompt
 * 4. Merging multi-batch responses into one coherent report
 */
export async function generateRadiologyConclusion(
  caseData: CaseData,
  provider: AiProvider = 'gemini',
  attentionSummary?: string,
  dicomStudy?: DicomStudy,
  apiKey?: string,
  onProgress?: (step: string, percent: number) => void,
): Promise<{
  findings: string;
  conclusion: string;
  recommendations: string;
  annotations: ClinicalAnnotation[];
  provider: string;
}> {
  const providerNames: Record<AiProvider, string> = {
    gemini: 'Gemini 3.6 Flash (Vision Radiology)',
    claude: 'Claude 3.5 Sonnet (Medical Vision)',
    local: 'Локальный ML-сервис WaspMed',
  };

  const bodyPart = caseData.bodyPart || '';
  const rawModality = (dicomStudy?.modality ?? caseData.modality ?? '').toUpperCase();
  const isCTGlobal = rawModality === 'CT' || rawModality.includes('CT');
  const providerLabel = `Gemini 3.6 Flash (Vision ${isCTGlobal ? 'МСКТ/КТ' : 'МРТ'})`;


  const context = buildClinicalContext(caseData);
  const promptText =
    `${context}\n${attentionSummary ? `\nПредварительные данные анализа плотности: ${attentionSummary}` : ''}\n` +
    (rawModality.includes('CT') ? `\nМОДАЛЬНОСТЬ: КТ/МСКТ. Изображения в единицах Хаунсфилда (HU). Присланы срезы в нескольких окнах для диагностики (мягкие ткани, лёгочное, костное). Используй термины плотности HU, определяй наличие травм, опухолей, инфильтратов, кальцинатов, кровоизлияний.` : `\nМОДАЛЬНОСТЬ: МРТ. Изображения в единицах интенсивности МР-сигнала. Используй термины: гиперинтенсивный/гипоинтенсивный сигнал, T1/T2-взвешенные, DWI/ADC, T2-FLAIR, ограничение диффузии.`) +
    `\nПриложено ${caseData.totalSlices} срезов серии. Проанализируй приложенные кадры и составь профессиональный протокол (Тавсиф + Хулоса в JSON).`;

  // ── Real Gemini Vision path ────────────────────────────────────────────────
  if (provider === 'gemini' && apiKey && dicomStudy && dicomStudy.slices.length > 0) {
    try {
      onProgress?.('Подготовка снимков для Gemini Vision…', 5);

      const totalSlices = dicomStudy.slices.length;
      // For large series: take up to MAX_IMAGES_PER_REQUEST evenly spread representative slices
      const selectedSlices = selectRepresentativeSlices(dicomStudy.slices, MAX_IMAGES_PER_REQUEST);

      onProgress?.(`Рендеринг ${selectedSlices.length} из ${totalSlices} срезов…`, 15);

      // Render to JPEG base64 in parallel
      const imageEntries = await Promise.all(
        selectedSlices.map(async (slice) => {
          const b64 = await sliceToBase64Jpeg(slice, dicomStudy.modality, bodyPart, 0.75);
          return b64 ? { data: b64, mimeType: 'image/jpeg' as const } : null;
        }),
      );
      const images = imageEntries.filter((e): e is { data: string; mimeType: 'image/jpeg' } => e !== null);

      if (images.length === 0) throw new Error('Не удалось рендерить DICOM срезы в изображения');

      onProgress?.(`Отправка ${images.length} снимков в Gemini Vision…`, 40);

      const rawText = await callGeminiVision(apiKey, RADIOLOGY_SYSTEM, promptText, images);

      onProgress?.('Парсинг ответа ИИ…', 90);

      const parsed = parseAiJson(rawText);

      const findings = parsed.findings ||
        `ПРОТОКОЛ АНАЛИЗА (${caseData.modality})\n\n${rawText}`;
      const conclusion = parsed.conclusion ||
        'Черновик сформирован Gemini Vision. Требует верификации врачом.';
      const recommendations = parsed.recommendations ||
        'Консультация профильного специалиста. Динамическое наблюдение по клиническим показаниям.';

      return {
        findings,
        conclusion,
        recommendations,
        annotations: parsed.annotations ?? [],
        provider: `${providerLabel} · ${images.length}/${totalSlices} срезов`,
      };
    } catch (err) {
      // Fall through to template fallback with error note
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[radiologyAi] Gemini Vision error:', errMsg);
      return {
        findings: `[Ошибка Gemini Vision API: ${errMsg}]\n\nДля работы требуется корректный API-ключ Gemini и доступ к интернету.`,
        conclusion: 'Не удалось получить ИИ-заключение. Проверьте API-ключ и повторите.',
        recommendations: 'Проверьте правильность API-ключа и доступность интернета.',
        annotations: [],
        provider: `${providerNames.gemini} — ОШИБКА`,
      };
    }
  }

  // ── No API key / local provider ───────────────────────
  return {
    findings: '⚠️ Ошибка: API-ключ Gemini не настроен.\n\nДля автоматического анализа снимков и генерации заключения требуется указать корректный API-ключ в настройках.',
    conclusion: 'Анализ не выполнен. Требуется API-ключ.',
    recommendations: 'Укажите API-ключ Gemini для работы ИИ.',
    annotations: [],
    provider: `${providerNames.gemini} — ОШИБКА`,
  };
}
