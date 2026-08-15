import { AttentionRegion } from './analyze';

/**
 * Client for the local AI service (ai-service/, FastAPI on :8421).
 * The workspace probes it before analysis and transparently falls back
 * to the in-browser statistical analyzer when it is not running.
 */

const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:8421';

export interface AiEngineInfo {
  id: string;
  name: string;
  description: string;
  modalities: string[];
  ready: boolean;
}

export interface AiServiceHealth {
  version: string;
  engines: AiEngineInfo[];
}

export interface AiAnalysisResponse {
  engineId: string;
  engineName: string;
  regions: AttentionRegion[];
  summary: string;
  elapsedSec: number;
  extra: Record<string, unknown>;
}

/** Probes the service; resolves to null when it is not reachable. */
export async function checkAiService(): Promise<AiServiceHealth | null> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== 'ok') return null;
    return { version: data.version, engines: data.engines ?? [] };
  } catch {
    return null;
  }
}

/** Sends the study ZIP for analysis. Throws with a readable message on failure. */
export async function analyzeViaService(
  zipFile: File,
  engine = 'auto',
): Promise<AiAnalysisResponse> {
  const form = new FormData();
  form.append('file', zipFile);
  const res = await fetch(
    `${AI_SERVICE_URL}/analyze?engine=${encodeURIComponent(engine)}`,
    { method: 'POST', body: form, signal: AbortSignal.timeout(300_000) },
  );
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  const data = await res.json();
  const regions: AttentionRegion[] = (data.regions ?? []).map(
    (r: Record<string, number | string>) => ({
      sliceNumber: Number(r.sliceNumber),
      cx: Number(r.cx),
      cy: Number(r.cy),
      rx: Number(r.rx),
      ry: Number(r.ry),
      score: Number(r.score),
      meanValue: Number(r.meanValue),
      label: String(r.label),
    }),
  );
  return {
    engineId: data.engine?.id ?? 'unknown',
    engineName: data.engine?.name ?? 'AI-сервис',
    regions,
    summary: data.summary ?? '',
    elapsedSec: data.elapsedSec ?? 0,
    extra: data.extra ?? {},
  };
}
