// ============================================
// Core Beauty Types (Task-Beauty-Mini-016 extended)
// ============================================

import type { ReportLevel } from "./report-level";

export interface FaceAnalysisResult {
  skinType: string;
  hydrationLevel: number;
  oilLevel: number;
  poreCondition: string;
  wrinkles: number;
  ageEstimate: number;
  suggestions: string[];
  timestamp: string;
  makeupStyle: string;
  facialFeatures: {
    eyeShape: string;
    browShape: string;
    lipShape: string;
    faceShape: string;
  } & Record<string, unknown>;
  makeupTags: Array<{
    category: "brow" | "eye" | "lip";
    label: string;
    description: string;
  }>;
  productRecommendations: BeautyProduct[];
  kolRecommendations: Array<{
    id: string;
    name: string;
    avatar?: string;
    intro: string;
  }>;
}

export interface BeautyProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: "brow" | "eye" | "lip" | "skincare";
  price: number;
  reason: string;
  purchaseUrl: string;
}

export interface FaceAnalysisContent {
  faceShape: string;
  faceRatio: number;
  symmetryScore: number;
  description: string;
  highlightPoints: string[];
}

export interface MakeupStyleContent {
  primaryStyle: string;
  secondaryStyles: string[];
  occasion: "daily" | "formal" | "evening" | "special";
  confidence: number;
  suggestions: string[];
}

export interface ColorAnalysisContent {
  skinToneCategory: "warm" | "cool" | "neutral" | "olive";
  recommendedPalette: string[];
  avoidColors: string[];
  foundationTip: string;
}

export interface ProductRecommendation {
  id: string;
  category: "brow" | "eye" | "lip" | "skincare";
  productType: string;
  name: string;
  brand: string;
  reason: string;
  priority: "high" | "medium" | "low";
  priorityScene?: string;
  recommendedTags?: string[];
}

export interface CreatorRecommendation {
  id: string;
  name: string;
  avatar?: string;
  platform?: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  description: string;
  styleTags: string[];
  matchScore?: number;
  matchReasons?: string[];
  suitableStyle?: string;
}

export interface BeautyReportContent {
  faceAnalysis?: FaceAnalysisContent;
  makeupStyle?: MakeupStyleContent;
  colorAnalysis?: ColorAnalysisContent;
  productRecommendation?: ProductRecommendation[];
  creatorRecommendation?: CreatorRecommendation[];
  generatedAt: string;
  version: "v1";
}

export interface BeautyReportLevelData {
  level: ReportLevel;
  levelName: string;
  isFree: boolean;
  tokenCost: number;
  content: BeautyReportContent;
}

export interface Profile {
  faceShape: string;
  style: string;
  description: string;
}

export interface FaceMetrics {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;
}

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

export interface Features {
  eyes: string;
  brows: string;
  nose: string;
  lips: string;
}

export interface MakeupRecommendation {
  recommendations: string[];
}

export interface ColorRecommendation {
  recommendedColors: string[];
}

export interface ProductPlaceholder {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: "brow" | "eye" | "lip" | "skincare";
  price: number;
  reason: string;
}

export interface BloggerPlaceholder {
  id: string;
  name: string;
  avatar?: string;
  platform?: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  description: string;
  styleTags: string[];
}

export interface BeautyReport {
  id: string;
  reportCode: string;
  userId: string;
  imageUrl?: string;
  level: ReportLevel;
  analysis: FaceAnalysisResult;
  createdAt: string;
  profile: Profile;
  faceMetrics: FaceMetrics;
  features: Features;
  makeup: MakeupRecommendation;
  colors: ColorRecommendation;
  products: ProductPlaceholder[];
  bloggers: BloggerPlaceholder[];
  content?: BeautyReportContent;
}

export interface ReportSummary {
  reportId: string;
  reportCode: string;
  createdAt: string;
  styleName: string;
}

export interface BeautyProfile {
  userId: string;
  nickname: string;
  avatar: string;
  styleName: string;
  reports: ReportSummary[];
}

export interface AnalysisResultData {
  skinType: string;
  hydrationLevel: number;
  oilLevel: number;
  poreCondition: string;
  wrinkles: number;
  ageEstimate: number;
  suggestions: string[];
  makeupStyle: string;
  facialFeatures: Record<string, unknown>;
}

export interface AnalysisTask {
  taskId: string;
  status: "pending" | "processing" | "success" | "failed";
  progress: number;
  reportId: string;
  errorMessage?: string;
  createdAt?: string;
  userId?: string;
}

export interface ShareRecord {
  id: string;
  reportId: string;
  shareUserId?: string;
  status: "created" | "completed";
  createdAt: string;
}

export interface BeautyCreator {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  platform: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  description: string;
  styleTags: string[];
  works: string[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface CreatorApplication {
  id: string;
  creatorId: string;
  faceImageDeleted: boolean;
  workImages: string[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface CreatorApplyRequest {
  name: string;
  avatar: string;
  platform: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  description: string;
  styleTags: string[];
  faceImageUrl: string;
  workImages: string[];
}

export interface CreatorApplyResponse {
  creatorId: string;
  status: "pending";
}

export type EntitlementSource = "free" | "token" | "payment" | "activity";

export interface Entitlement {
  id: string;
  userId: string;
  reportId?: string;
  productType: "beauty_pro" | "report_unlock";
  source: EntitlementSource;
  amount: number;
  tokenCount: number;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
  expiresAt?: string;
}

export interface EntitlementRecord extends Entitlement {
  unlocked: boolean;
  unlockTime?: string;
}

export type ReportContentModule =
  | "faceAnalysis"
  | "makeupStyle"
  | "colorAnalysis"
  | "makeupSuggestion"
  | "productRecommendation"
  | "kolRecommendation"
  | "beautyPlan";

export interface ReportContentPermission {
  level: "first-look" | "style-upgrade" | "beauty-pro";
  module: ReportContentModule;
  enabled: boolean;
}

export interface ContentPermissionConfig {
  [level: string]: { [module in ReportContentModule]: boolean };
}

export interface BeautyUserProfile {
  userId: string;
  guestId: string | null;
  wechatOpenId: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export interface GuestSession {
  guestId: string;
  userId: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface WechatBindRequest {
  userId: string;
  wechatOpenId: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface WechatBindResponse {
  success: boolean;
  userId: string;
  merged: boolean;
  message?: string;
}

export interface BeautyUser {
  userId: string;
  guestId: string | null;
  wechatOpenId: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastActiveAt: string;
  isWechatBound: boolean;
  isGuest: boolean;
}

export interface UserInitResult {
  success: boolean;
  user: BeautyUser;
  isNewUser: boolean;
}

export interface WechatBindResult {
  success: boolean;
  user: BeautyUser;
  merged: boolean;
  message?: string;
}

// ============================================
// Creator Profile (Task-BeautyMini-060)
// ============================================

export type FaceShapeTag = "鹅蛋脸" | "圆脸" | "长脸" | "方脸" | "心形脸" | "所有脸型";
export type ColorTag = "奶茶色" | "玫瑰色" | "裸粉色" | "香槟金" | "橘棕色" | "豆沙色" | "珊瑚红" | "暖皮" | "冷皮" | "中性皮";
export type MakeupTag = "底妆" | "眼妆" | "唇妆" | "腮红" | "修容" | "全妆";
export type SceneTag = "日常通勤" | "甜美约会" | "派对晚宴" | "商务职场" | "清新校园" | "特殊场合";

export interface CreatorProfile {
  id: string;
  name: string;
  styleTags: string[];
  faceShapeTags: FaceShapeTag[];
  colorTags: ColorTag[];
  makeupTags: MakeupTag[];
  suitableScenes: SceneTag[];
}

export interface CreatorMatchScore {
  styleScore: number;
  faceScore: number;
  colorScore: number;
  totalScore: number;
}

export interface CreatorMatchResult extends CreatorProfile {
  matchScore: CreatorMatchScore;
  matchReasons: string[];
}

// UserAestheticProfile (Task-BeautyMini-060)
export interface UserAestheticProfile {
  faceShape: FaceShapeTag;
  skinTone: string;
  makeupPreference: string;
  stylePreference: string;
}
