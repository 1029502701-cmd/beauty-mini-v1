export type Platform = "xiaohongshu" | "douyin" | "weibo" | "bilibili";

export type FaceShapeType = "鹅蛋脸" | "圆脸" | "长脸" | "方脸" | "心形脸";
export type EyeShapeType = "杏眼" | "丹凤眼" | "圆眼" | "欧式眼" | "单眼皮";
export type LipShapeType = "饱满唇" | "薄唇" | "嘟嘟唇";
export type MakeupStyleType = "清透自然型" | "欧美浓妆型" | "韩系甜妹型" | "成熟御姐型" | "日系清新型";
export type ColorType = "奶茶色" | "玫瑰色" | "裸粉色" | "香槟金" | "橘棕色" | "豆沙色" | "珊瑚红";
export type SkinToneType = "冷皮" | "暖皮" | "中性皮";

/**
 * User's beauty analysis result from report (V2 includes FaceMetrics)
 */

export interface UserBeautyReport {
  faceShape: FaceShapeType;
  eyeShape: EyeShapeType;
  lipShape: LipShapeType;
  makeupStyle: MakeupStyleType;
  colorRecommendation: ColorType[];
  skinTone: SkinToneType;
  faceMetrics: FaceMetrics;
} ;

/**
 * KOL/Blogger data with full tags and metadata including numerical face metrics range (V2)
 */

export interface Blogger {
  id: string;
  name: string;
  avatar?: string;
  platform: Platform;
  description: string;
  styleTags: MakeupStyleType[];
  faceShapeSupports: FaceShapeType[];
  eyeShapeSupports: EyeShapeType[];
  lipShapeSupports: LipShapeType[];
  colorSupports: ColorType[];
  skinToneSupports: SkinToneType[];
  targetAudience: string;
  faceMetricsRange?: FaceMetricsRange;
  popularity?: number;
  followersCount?: number;
} ;

/**
 * Match result with scoring and reasons
 */

export interface MatchResult {
  bloggerId: string;
  score: number;
  matchReasons: string[];
  matchDetails?: Record<string, number>;
} ;

/**
 * Configuration for matching weights (V2)
 */

export interface MatchWeights {
  faceMetrics: number;   // 40% - real facial data matching
  makeupStyle: number;    // 30% - style tag matching
  color: number;          // 10% - color overlap
  facialFeatures: number; // 10% - eye/lip shape matching
  scenario: number;       // 10% - audience/scenario matching
} ;

/**
 * Service interface for KOL matching
 */

export interface KOLMatcherService {
  matchBloggers(userReport: UserBeautyReport, bloggers: Blogger[]): Promise<MatchResult[]>;
  getBloggerScore(userReport: UserBeautyReport, blogger: Blogger): MatchResult;
  getWeightConfig(): MatchWeights;
  setWeightConfig(weights: Partial<MatchWeights>): void;
} ;

export const DEFAULT_WEIGHTS: MatchWeights = {
  faceMetrics: 50,
  makeupStyle: 30,
  color: 0,
  facialFeatures: 0,
  scenario: 0,
} ;

export function supportsFeature(
  userFeature: string ,
  supportedFeatures: string[]
) : boolean {
  return supportedFeatures.includes(userFeature);
} ;

export function hasOverlap<T>(arr1 : T[] , arr2 : T[]) : boolean {
  return arr1.some(item => arr2.includes(item as any));
} ;

/**
 * Face Metrics for V2 Numerical Matching (8 key measurements)
 */
export interface FaceMetrics {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;
  jawWidth: number;
  chinLength: number;
  eyeDistance: number;
  noseWidth: number;
  lipWidth: number;
} ;

/**
 * Preferred range for each face metric (min, max) for matching purposes
 */
export interface FaceMetricsRange {
  faceRatioRange?: [number, number];
  jawWidthRange?: [number, number];
  eyeDistanceRange?: [number, number];
  lipWidthRange?: [number, number];
  chinLengthRange?: [number, number];
  noseWidthRange?: [number, number];
} ;
