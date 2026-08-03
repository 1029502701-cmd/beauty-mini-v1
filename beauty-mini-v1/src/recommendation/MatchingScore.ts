import type { FaceMetrics, FaceShapeType, EyeShapeType, LipShapeType, MakeupStyleType, ColorType, SkinToneType } from "./types";
import { DEFAULT_WEIGHTS, supportsFeature, hasOverlap } from "./types";
import { FaceMetricMatcher } from "./FaceMetricMatcher";
/**
 * Face Metrics Real Data Matching Score (V2 - 40% weight)
 * Uses numerical comparison of facial measurements against preferred ranges
 */
export function calculateFaceMetricsScore(
  userFaceMetrics: FaceMetrics,
  bloggerFaceRange?: FaceMetricsRange
): number {
  return FaceMetricMatcher.match(userFaceMetrics, bloggerFaceRange);
} ;

/**
 * Makeup Style Matching Score (30% weight)
 */
export function calculateMakeupStyleScore(
  userMakeupStyle: MakeupStyleType,
  bloggerStyles: MakeupStyleType[]
): number {
  return supportsFeature(userMakeupStyle, bloggerStyles) ? 100 : 0;
} ;

/**
 * Color Matching Score (10% weight)
 */
export function calculateColorScore(
  userColors: ColorType[],
  bloggerColors: ColorType[]
): number {
  if (userColors.length === 0 || bloggerColors.length === 0) return 0;
  const overlap = userColors.filter(c => bloggerColors.includes(c)).length;
  return Math.round((overlap / userColors.length) * 100);
} ;

/**
 * Facial Features Matching Score (10% weight)
 * Includes eye shape and lip shape compatibility
 */
export function calculateFacialFeaturesScore(
  userEyeShape: EyeShapeType,
  userLipShape: LipShapeType,
  bloggerEyeShapes?: EyeShapeType[],
  bloggerLipShapes?: LipShapeType[]
): number {
  let score = 0;
  if (bloggerEyeShapes && supportsFeature(userEyeShape, bloggerEyeShapes)) score += 50; else if (!bloggerEyeShapes) score += 25;
  if (bloggerLipShapes && supportsFeature(userLipShape, bloggerLipShapes)) score += 50; else if (!bloggerLipShapes) score += 25;
  return score;
} ;

/**
 * Scenario/Target Audience Matching Score (10% weight)
 */
export function calculateScenarioScore(
  userMakeupStyle: MakeupStyleType,
  bloggerTargetAudience: string
): number {
  const styleToScenario: Record<MakeupStyleType, string> = {
    "清透自然型": "日常通勤",
    "欧美浓妆型": "派对晚宴",
    "韩系甜妹型": "甜美约会",
    "成熟御姐型": "成熟商务",
    "日系清新型": "清新校园"
  };
  const expectedScenario = styleToScenario[userMakeupStyle] || "";
  return expectedScenario.includes(bloggerTargetAudience) ? 100 : 50;
} ;

/**
 * Overall weighted score calculation (V2: FaceMetrics 40%, Style 30%, Features 10%, Color 10%, Scenario 10%)
 */
export function calculateTotalScore(
  weights: Record<string, number> = DEFAULT_WEIGHTS,
  scores: { faceMetrics: number; makeupStyle: number; color: number; facialFeatures: number; scenario: number }
): number {
  const total = 
    (scores.faceMetrics * weights.faceMetrics / 100) +
    (scores.makeupStyle * weights.makeupStyle / 100) +
    (scores.color * weights.color / 100) +
    (scores.facialFeatures * weights.facialFeatures / 100) +
    (scores.scenario * weights.scenario / 100);
  return Math.min(100, Math.round(total * 100) / 100);
} ;

/**
 * Generate match reasons based on scoring details (V2 updated)
 */
export function generateMatchReasons(
  userReport: any,
  blogger: any,
  scores: any,
  userFaceMetrics?: any,  // New for V2 face metrics
  bloggerFaceRange?: any
): string[] {
  const reasons: string[] = [];

  // Face Metrics reason (NEW - V2 priority)
  if (scores.faceMetrics >= 80 && userFaceMetrics && bloggerFaceRange) {
    const faceReasons = FaceMetricMatcher.generateFaceReasons(userFaceMetrics, bloggerFaceRange);
    reasons.push(...faceReasons);
  } else if (scores.faceMetrics === 100) {
    reasons.push("面部数据比例与达人风格高度契合");
  }

  // Makeup style reason
  if (scores.makeupStyle === 100) {
    reasons.push(`适合${userReport.makeupStyle}风格`);
  }

  // Color reason
  if (scores.color > 70) {
    reasons.push("推荐色系与你肤色一致");
  } else if (scores.color > 40) {
    reasons.push("推荐色系部分匹配");
  }

  // Facial features reason
  if (scores.facialFeatures >= 75) {
    reasons.push("五官特征搭配协调");
  }

  // Scenario reason
  if (scores.scenario >= 80) {
    reasons.push("场景适配度佳");
  }

  return reasons.length > 0 ? reasons : ["达人风格与您的要求匹配"];
} ;
