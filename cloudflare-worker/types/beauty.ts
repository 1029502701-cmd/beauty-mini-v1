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
 * Expanded face metrics with detailed geometric measurements.
 * All extra fields are optional to preserve backward compatibility.
 */
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

/**
 * Face shape classification result with confidence score.
 */
export interface FaceShapeResult {
  faceShape: string;
  confidence: number;
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

/**
 * Makeup style suggestion with detailed reason and suitable occasion.
 * Extended with keyPoints and avoidTips for actionable guidance.
 */
export interface MakeupStyleDetail {
  styleName: string;
  reason: string;
  suitableOccasion: string;
  /** Key makeup focus areas for this style */
  keyPoints: string[];
  /** Tips on what to avoid to prevent style conflicts */
  avoidTips: string[];
}

export interface ColorRecommendationSection {
  skinToneCategory: "warm" | "cool" | "neutral" | "olive";
  recommendedPalette: string[];
  avoidColors: string[];
  foundationTip: string;
}

/**
 * Color analysis result for skin tone recommendation.
 * Extended with four-season color system.
 */
export interface ColorAnalysis {
  skinTone: string;
  skinToneCategory: "warm" | "cool" | "neutral" | "olive";
  recommendedColors: string[];
  avoidColors: string[];
  foundationTip: string;
  /** Four-season color type (spring/summer/autumn/winter) */
  seasonType?: string;
  /** Daily-wear palette colors */
  dailyColors?: string[];
  /** Special-occasion palette colors */
  specialColors?: string[];
}

/**
 * Facial insight – user-perceivable professional description of facial features.
 * Replaces raw metric strings with natural-language strengths and concerns.
 */
export interface FaceInsight {
  /** Natural-language summary of the overall face analysis */
  summary: string;
  /** List of facial strengths to highlight */
  strengths: string[];
  /** List of areas where makeup can help improve appearance */
  concerns: string[];
}

/**
 * Seasonal color analysis result with four-season system support.
 */
export interface SeasonColorAnalysis {
  /** One of "spring" | "summer" | "autumn" | "winter" */
  seasonType: string;
  /** Colors best suited for daily wear */
  dailyColors: string[];
  /** Colors best suited for special occasions */
  specialColors: string[];
  /** Brief explanation of why these colors work */
  seasonDescription: string;
}

/**
 * Style upgrade content – only populated for style-upgrade and beauty-pro levels.
 */
export interface StyleUpgradeContent {
  /** Detailed style recommendations with key points */
  styleRecommendations: string[];
  /** Eye makeup direction */
  eyeMakeupDirection: string;
  /** Contour direction */
  contourDirection: string;
  /** Lip color direction */
  lipColorDirection: string;
}

/**
 * Personal beauty plan – only populated for beauty-pro level reports.
 */
export interface PersonalBeautyPlan {
  /** Priority action items for the user */
  actionItems: string[];
  /** Step-by-step makeup routine */
  makeupRoutine: string[];
  /** Skincare and beauty tips */
  beautyTips: string[];
  /** Recommended look for a signature style */
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

/**
 * Enhanced beauty report content with improved analysis fields.
 * Backward compatible with BeautyReportContent (extra fields are additive).
 *
 * Field population by level:
 *   first-look  : faceInsight (always present)
 *   style-upgrade: faceInsight + seasonColorAnalysis + styleUpgradeContent
 *   beauty-pro  : all of the above + personalPlan
 */
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
  /** Facial insight with strengths and concerns (all levels) */
  faceInsight?: FaceInsight;
  /** Seasonal color analysis (style-upgrade+) */
  seasonColorAnalysis?: SeasonColorAnalysis;
  /** Detailed style upgrade content (style-upgrade+) */
  styleUpgradeContent?: StyleUpgradeContent;
  /** Personalized beauty plan (beauty-pro only) */
  personalPlan?: PersonalBeautyPlan;
}