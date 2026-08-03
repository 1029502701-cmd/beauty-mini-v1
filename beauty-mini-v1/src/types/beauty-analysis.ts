// ============================================
// Beauty Analysis Data Model (Task-BeautyMini-024)
// ============================================

// ==================== Request Type ====================
export interface BeautyAnalysisRequest {
  /** 用户ID */
  userId: string;
  /** 图片ID */
  imageId: string;
  /** 图片URL（已上传的远程地址） */
  imageUrl: string;
  /** 报告等级：first-look, style-upgrade, beauty-pro */
  reportLevel: "first-look" | "style-upgrade" | "beauty-pro";
}

// ==================== Face Metrics ====================
export interface EyeMetrics {
  /** 眼距 */
  eyeSpacing: number;
  /** 眼睛对称度 */
  symmetry: number;
  /** 眼神清澈度 */
  clarity: number;
}

export interface NoseMetrics {
  /** 鼻梁高度评分 */
  bridgeHeight: number;
  /** 鼻头圆润度 */
  tipRoundedness: number;
  /** 鼻翼宽度 */
  alarWidth: number;
}

export interface LipMetrics {
  /** 唇部厚度评分 */
  thickness: number;
  /** 唇形饱满度 */
  fullness: number;
  /** 唇部对称度 */
  symmetry: number;
}

export interface FaceMetrics {
  /** 脸型：圆脸、方脸、鹅蛋脸、心形脸等 */
  faceShape: string;
  /** 面部宽度（像素） */
  faceWidth: number;
  /** 面部高度（像素） */
  faceHeight: number;
  /** 面部宽高比 */
  faceRatio: number;
  /** 颌部宽度（像素） */
  jawWidth: number;
  /** 下巴长度（像素） */
  chinLength: number;
  /** 眼睛指标 */
  eyeMetrics: EyeMetrics;
  /** 鼻部指标 */
  noseMetrics: NoseMetrics;
  /** 唇部指标 */
  lipMetrics: LipMetrics;
}

// ==================== Analysis Result ====================
export interface Analysis {
  /** 推荐妆容风格 */
  makeupStyle: string;
  /** 推荐色系 */
  colorRecommendation: string[];
  /** 综合美丽评分（0-100） */
  beautyScore: number;
  /** 个性化美容建议 */
  suggestions: string[];
}

export interface BeautyAnalysisResult {
  /** 面部测量数据 */
  faceMetrics: FaceMetrics;
  /** AI分析结果 */
  analysis: Analysis;
}

// ==================== Report Type ====================
export interface BeautyReport {
  /** 报告唯一ID */
  reportId: string;
  /** 用户ID */
  userId: string;
  /** 报告等级 */
  level: "first-look" | "style-upgrade" | "beauty-pro";
  /** 分析结果 */
  analysisResult: BeautyAnalysisResult;
  /** 生成时间 */
  createdAt: string;
  /** 过期时间（根据等级不同） */
  expireAt: string;
}
