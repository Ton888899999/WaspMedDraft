export type WindowPreset = 'soft_tissue' | 'bone' | 'lung' | 'brain';

export interface FindingAnnotation {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  label: string;
  sublabel?: string;
  activeSliceRange: [number, number];
  severity: 'pathology' | 'warning' | 'normal';
}

/** A precise clinical annotation returned by the AI model */
export interface ClinicalAnnotation {
  label: string;          // e.g. "Грыжа L4-L5 (4.8 мм)"
  slicePercent: number;   // 0-100: position in series (0=first slice, 100=last)
  cx: number;             // 0-100: horizontal position in image
  cy: number;             // 0-100: vertical position in image
  severity: 'pathology' | 'warning' | 'info';
}

export interface TraceabilityItem {
  phrase: string;
  slices: string;
  confidence: number;
  roi: string;
  details: string;
  targetSlice?: number;
}

export interface CaseData {
  id: string;
  title: string;
  caseBadge: string;
  caseType: 'brain' | 'lung' | 'knee' | 'custom';
  isPathology: boolean;
  modality: string;
  protocolName: string;
  patientId: string;
  patientName: string;
  patientAgeSex: string;
  studyDate: string;
  studyTime: string;
  hospitalName: string;
  deviceModel: string;
  bodyPart: string;
  sliceThickness: string;
  totalSlices: number;
  defaultSlice: number;
  coil: string;
  contrast: string;
  kvpMa: string;
  radiationDose: string;
  fovMatrix: string;
  confidenceScore: number;
  processingTime: string;
  annotation?: FindingAnnotation;
  studyArea: string;
  findingsText: string;
  traceableItems: TraceabilityItem[];
  impression: string;
  recommendations: string;
  icdCode: string;
  biradsOrRadlex?: string;
  aiAnnotations?: ClinicalAnnotation[];
}

export interface GenerationStep {
  id: number;
  title: string;
  subtext: string;
  iconName: string;
}

export interface SignatureData {
  isSigned: boolean;
  doctorName: string;
  doctorRole: string;
  timestamp: string | null;
  certNumber: string;
  cryptoAlg: string;
  hash: string;
}
