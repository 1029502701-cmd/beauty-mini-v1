/**
 * Report depth levels that control analysis detail and recommendation specificity.
 */
export type ReportLevel = "first-look" | "style-upgrade" | "beauty-pro";

/**
 * Skin tone category used in report generation.
 */
export type SkinTone = "fair" | "medium" | "warm" | "olive" | "dark";

/**
 * User profile snapshot used when generating a beauty report.
 */
export interface UserProfile {
  userId: string;
  nickname: string;
  skinTone?: SkinTone;
  preferredStyle?: string;
}

/**
 * Single section of a beauty report.
 */
export interface ReportSection {
  title: string;
  content: string[];
}

/**
 * Complete beauty report returned to the client (legacy v1 shape).
 */
export interface BeautyReport {
  analysisId: string;
  reportLevel: ReportLevel;
  title: string;
  faceSummary: ReportSection;
  makeupStyle: ReportSection;
  colorAdvice: ReportSection;
  productAdvice: ReportSection;
  beautyPlan: ReportSection;
  createdAt: string;
}

/**
 * Re-export V2 types for convenience from the report-engine surface.
 */
export type {
  BeautyReportContentV2,
  BeautyFaceMetrics,
  BeautyFaceMetricsExtended,
  FaceAnalysisSection,
  FaceShapeResult,
  FeatureHighlight,
  MakeupStyleDetail,
  MakeupStyleSuggestion,
  ColorRecommendationSection,
  ColorAnalysis,
  StyleDirection,
  FaceInsight,
  SeasonColorAnalysis,
  StyleUpgradeContent,
  PersonalBeautyPlan,
} from "../types/beauty";
