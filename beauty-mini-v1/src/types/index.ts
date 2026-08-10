// Upload-related types
export interface UploadResult {
  success: boolean;
  message: string;
  uploadId?: string;
  imageUrl?: string;
}

export interface BeautyImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  timestamp: string;
  status: "pending" | "uploading" | "uploaded" | "analyzing" | "analyzed";
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Re-export core beauty types from beauty.ts
export type {
  FaceAnalysisResult,
  BeautyProduct,
  BeautyReport,
  ReportSummary,
  BeautyProfile,
  AnalysisTask,
  ShareRecord,
  BeautyCreator,
  CreatorApplication,
  CreatorApplyRequest,
  CreatorApplyResponse,
  Entitlement,
  EntitlementSource,
  EntitlementRecord,
  ReportContentModule,
  ReportContentPermission,
  ContentPermissionConfig,
  // Three-tier report content types
  FaceAnalysisContent,
  MakeupStyleContent,
  ColorAnalysisContent,
  ProductRecommendation,
  CreatorRecommendation,
  BeautyReportContent,
  BeautyReportLevelData,
  // Unified user identity types
  BeautyUser,
  UserInitResult,
  WechatBindResult,
  // Creator Profile (Task-BeautyMini-060)
  FaceShapeTag,
  ColorTag,
  MakeupTag,
  SceneTag,
  CreatorProfile,
  CreatorMatchScore,
  CreatorMatchResult,
} from "./beauty";

// Export report level types
export * from "./report-level";

// Export token types including new UserTokenBalance
export type {
  BeautyToken,
  BeautyUserQuota,
  UserTokenBalance,
  TokenBalanceResult,
  TokenConsumeResult,
  TokenTopupResult,
} from "./token";

// Export token transaction types
export type { TokenTransaction, TransactionType, TransactionStatus } from "./token-transaction";

// Recommendation module types
export * from "./recommendation/types";
