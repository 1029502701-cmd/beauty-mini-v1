/**
 * Shared BeautyFaceMetrics type - mirrors beauty-mini-v1/src/types/beauty.ts
 */
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

/**
 * Report content sections (mirrors beauty-mini-v1/src/types/beauty.ts)
 */
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

export interface ColorRecommendationSection {
  skinToneCategory: "warm" | "cool" | "neutral" | "olive";
  recommendedPalette: string[];
  avoidColors: string[];
  foundationTip: string;
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
