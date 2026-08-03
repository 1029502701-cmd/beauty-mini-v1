// ============================================
// Beauty Face Metrics Types (mirrors cloudflare-worker/types/beauty.ts)
// Used by report-engine V2 generator
// ============================================

export interface BeautyFaceMetrics {
  faceShape: string;
  faceRatio: number;
  eyeType: string;
  eyeSize: number;
  noseRatio: number;
  lipRatio: number;
  jawType: string;
  skinTone: string;
}

export interface BeautyFaceMetricsExtended {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;
  jawWidth: number;
  chinLength: number;
  eyeWidth: number;
  noseWidth: number;
  lipWidth: number;
  faceShape: string;
  eyeType: string;
  eyeSize: number;
  noseRatio: number;
  lipRatio: number;
  jawType: string;
  skinTone: string;
}

export interface FaceShapeResult {
  faceShape: string;
  confidence: number;
}

export interface FaceAnalysisSection {
  faceShape: string;
  faceRatio: number;
  symmetryScore: number;
  description: string;
  highlightPoints: string[];
}

export interface FeatureHighlight {
  feature: "eyes" | "brows" | "nose" | "lips";
  shape: string;
  measurement: string;
  recommendation: string;
}

export interface MakeupStyleSuggestion {
  primaryStyle: string;
  secondaryStyles: string[];
  occasion: "daily" | "formal" | "evening" | "special";
  confidence: number;
}

export interface MakeupStyleDetail {
  styleName: string;
  reason: string;
  suitableOccasion: string;
  keyPoints: string[];
  avoidTips: string[];
}

export interface ColorRecommendationSection {
  skinToneCategory: "warm" | "cool" | "neutral" | "olive";
  recommendedPalette: string[];
  avoidColors: string[];
  foundationTip: string;
}

export interface ColorAnalysis {
  skinTone: string;
  skinToneCategory: "warm" | "cool" | "neutral" | "olive";
  recommendedColors: string[];
  avoidColors: string[];
  foundationTip: string;
  seasonType?: string;
  dailyColors?: string[];
  specialColors?: string[];
}

export interface FaceInsight {
  summary: string;
  strengths: string[];
  concerns: string[];
}

export interface SeasonColorAnalysis {
  seasonType: string;
  dailyColors: string[];
  specialColors: string[];
  seasonDescription: string;
}

export interface StyleUpgradeContent {
  styleRecommendations: string[];
  eyeMakeupDirection: string;
  contourDirection: string;
  lipColorDirection: string;
}

export interface PersonalBeautyPlan {
  actionItems: string[];
  makeupRoutine: string[];
  beautyTips: string[];
  signatureLook: string;
}

export interface StyleDirection {
  overallDirection: string;
  keyElements: string[];
  avoidPatterns: string[];
  vibeDescription: string;
}

export interface ProductRecommendationItem {
  id: string;
  category: "brow" | "eye" | "lip" | "skincare";
  productType: string;
  name: string;
  brand: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface BeautyReportContent {
  faceAnalysis: FaceAnalysisSection;
  featureHighlights: FeatureHighlight[];
  makeupStyle: MakeupStyleSuggestion;
  colorRecommendation: ColorRecommendationSection;
  styleDirection: StyleDirection;
  productRecommendation: ProductRecommendationItem[];
  generatedAt: string;
  version: "v1";
}

export interface BeautyReportContentV2 {
  faceAnalysis: FaceAnalysisSection;
  faceShapeResult: FaceShapeResult;
  featureHighlights: FeatureHighlight[];
  makeupStyle: MakeupStyleSuggestion;
  makeupStyleDetail: MakeupStyleDetail;
  colorRecommendation: ColorRecommendationSection;
  colorAnalysis: ColorAnalysis;
  styleDirection: StyleDirection;
  productRecommendation: ProductRecommendationItem[];
  generatedAt: string;
  version: "v2";
  faceInsight?: FaceInsight;
  seasonColorAnalysis?: SeasonColorAnalysis;
  styleUpgradeContent?: StyleUpgradeContent;
  personalPlan?: PersonalBeautyPlan;
}

// ============================================
// Beauty Decision Types (Task-Beauty-V8-Decision-010)
// ============================================

/**
 * Style preference for beauty-pro personal plan.
 */
export type BeautyStylePreference = "natural" | "refined" | "charismatic" | "individual";

/**
 * Occasion target for beauty-pro personal plan.
 */
export type BeautyOccasion = "daily" | "date" | "workplace" | "photo";

/**
 * Comfort / transformation level for beauty-pro personal plan.
 */
export type BeautyTolerance = "conservative" | "normal" | "bold";

/**
 * Single decision answer from the user.
 */
export interface BeautyDecisionAnswer {
  questionId: "style" | "occasion" | "tolerance";
  value: string;
  createdAt: string;
}

/**
 * Complete set of user decision answers for a beauty-pro report.
 */
export interface BeautyDecisionAnswers {
  style: BeautyStylePreference;
  occasion: BeautyOccasion;
  tolerance: BeautyTolerance;
  submittedAt: string;
}
