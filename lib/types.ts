export type WindowPreset = 'soft_tissue' | 'bone' | 'lung' | 'brain';

export interface FindingAnnotation {
  cx: number; // percentage X (0-100)
  cy: number; // percentage Y (0-100)
  rx: number; // radius X percentage
  ry: number; // radius Y percentage
  label: string;
  sublabel?: string;
  activeSliceRange: [number, number]; // [minSlice, maxSlice]
  severity: 'pathology' | 'warning' | 'normal';
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
