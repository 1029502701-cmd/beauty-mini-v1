export type Platform = "xiaohongshu" | "douyin" | "weibo" | "bilibili";

export type FaceShapeType = "¶ìµ°Á³" | "Ô²Á³" | "³¤Á³" | "·½Á³" | "ÐÄÐÎÁ³";
export type EyeShapeType = "ÐÓÑÛ" | "µ¤·ïÑÛ" | "Ô²ÑÛ" | "Å·Ê½ÑÛ" | "µ¥ÑÛÆ¤";
export type LipShapeType = "±¥Âú´½" | "±¡´½" | "à½à½´½";
export type MakeupStyleType = "ÇåÍ¸×ÔÈ»ÐÍ" | "Å·ÃÀÅ¨×±ÐÍ" | "º«ÏµÌðÃÃÐÍ" | "³ÉÊìÓù½ãÐÍ" | "ÈÕÏµÇåÐÂÐÍ";
export type ColorType = "ÄÌ²èÉ«" | "Ãµ¹åÉ«" | "Âã·ÛÉ«" | "ÏãéÄ½ð" | "éÙ×ØÉ«" | "¶¹É³É«" | "Éºº÷ºì";
export type SkinToneType = "ÀäÆ¤" | "Å¯Æ¤" | "ÖÐÐÔÆ¤";

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
  faceMetrics: 40,
  makeupStyle: 30,
  color: 10,
  facialFeatures: 10,
  scenario: 10,
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
