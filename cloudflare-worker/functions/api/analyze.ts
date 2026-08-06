export interface AnalyzeRequest {
  uploadId: string;
  imageUrl?: string;
  reportLevel?: "first-look" | "style-upgrade" | "beauty-pro";
  userId?: string;
  /** Real face metrics computed by MediaPipe on client-side */
  faceMetrics?: {
    faceShape: string;
    faceRatio: number;
    eyeType: string;
    eyeSize: number;
    noseRatio: number;
    lipRatio: number;
    jawType: string;
    skinTone: string;
    /** Extended geometric metrics (optional, populated by client-side face detection) */
    faceWidth?: number;
    faceHeight?: number;
    jawWidth?: number;
    chinLength?: number;
    eyeWidth?: number;
    noseWidth?: number;
    lipWidth?: number;
  };
}

export interface AnalysisResult {
  skinType: string;
  hydrationLevel: number;
  oilLevel: number;
  poreCondition: string;
  wrinkles: number;
  recommendation: string;
  faceFeatures: {
    skinMoisture: number;
    skinOil: number;
    pores: number;
    wrinkles: number;
    ageEstimate: number;
  };
  suggestions: string[];
}

export interface AnalyzeResponse {
  status: "success" | "error";
  result?: AnalysisResult;
  message?: string;
  analysisId?: string;
  reportId?: string;
  level?: string;
  beautyTask?: {
    id: string;
    userId?: string;
    reportId?: string;
    status: "pending" | "analyzing" | "completed" | "failed";
    createdAt: string;
  };
}