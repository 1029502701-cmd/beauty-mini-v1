import type {
  CreatorProfile,
  CreatorMatchResult,
  CreatorMatchScore,
  FaceShapeTag,
  ColorTag
} from "@/types/beauty";

/**
 * User aesthetic profile for creator matching (Task-BeautyMini-060)
 * Uses only aesthetic tags — no commercial metrics.
 */
export interface UserAestheticProfile {
  faceShape: FaceShapeTag;
  skinTone: string;
  makeupPreference: string;
  stylePreference: string;
}

/**
 * BloggerMatcher — V2 with aesthetic-tag matching for Task-BeautyMini-060
 *
 * matchBloggers() — existing V2 path (FaceMetrics-based)
 * matchCreators() — new aesthetic-tag-only path (no fan counts, no commercial data)
 */
export class BloggerMatcher {
  private weights: { style: number; face: number; color: number };

  constructor() {
    this.weights = { style: 40, face: 35, color: 25 };
  }

  // ──────────────────────────────────────────────────────────
  // Existing V2 method (FaceMetrics-based) — unchanged
  // ──────────────────────────────────────────────────────────

  async matchBloggers(
    userReport: { faceShape: string; eyeShape: string; lipShape: string; makeupStyle: string; colorRecommendation: string[]; skinTone: string; faceMetrics: Record<string, number> },
    bloggers: Array<{ id: string; faceShapeSupports?: string[]; styleTags?: string[]; colorSupports?: string[]; targetAudience?: string; popularity?: number; followersCount?: number }>
  ): Promise<Array<{ bloggerId: string; score: number; matchReasons: string[]; matchDetails?: Record<string, number> }>> {
    const results: Array<{ bloggerId: string; score: number; matchReasons: string[]; matchDetails?: Record<string, number> }> = [];
    for (const blogger of bloggers) {
      const score = this.getBloggerScore(userReport, blogger);
      results.push(score);
    }
    return results.sort((a, b) => b.score - a.score);
  }

  getBloggerScore(
    userReport: { faceShape: string; eyeShape: string; lipShape: string; makeupStyle: string; colorRecommendation: string[]; skinTone: string; faceMetrics: Record<string, number> },
    blogger: Record<string, unknown>
  ): { bloggerId: string; score: number; matchReasons: string[]; matchDetails?: Record<string, number> } {
    const faceMetricsScore = this._calcFaceMetricsScore(userReport.faceMetrics, blogger.faceMetricsRange as number[]);
    const makeupStyleScore = this._calcMakeupStyleScore(userReport.makeupStyle, blogger.styleTags as string[]);
    const colorScore = this._calcColorScore(userReport.colorRecommendation, blogger.colorSupports as string[]);
    const facialFeaturesScore = this._calcFacialFeaturesScore(userReport.eyeShape, userReport.lipShape, blogger.eyeShapeSupports as string[], blogger.lipShapeSupports as string[]);
    const scenarioScore = this._calcScenarioScore(userReport.makeupStyle, blogger.targetAudience as string);

    const detailedScores = {
      faceMetrics: faceMetricsScore,
      makeupStyle: makeupStyleScore,
      color: colorScore,
      facialFeatures: facialFeaturesScore,
      scenario: scenarioScore
    };

    const totalScore =
      (detailedScores.faceMetrics * 0.40) +
      (detailedScores.makeupStyle * 0.30) +
      (detailedScores.color * 0.10) +
      (detailedScores.facialFeatures * 0.10) +
      (detailedScores.scenario * 0.10);

    const matchReasons: string[] = [];
    if (makeupStyleScore === 100) matchReasons.push(`适合${userReport.makeupStyle}风格`);
    if (colorScore > 70) matchReasons.push("推荐色系与你肤色一致");
    if (facialFeaturesScore >= 75) matchReasons.push("五官特征搭配协调");
    if (scenarioScore >= 80) matchReasons.push("场景适配度佳");
    if (matchReasons.length === 0) matchReasons.push("达人风格与您的要求匹配");

    return {
      bloggerId: blogger.id as string,
      score: Math.min(100, Math.round(totalScore)),
      matchReasons,
      matchDetails: detailedScores
    };
  }

  // ──────────────────────────────────────────────────────────
  // Task-BeautyMini-060: Aesthetic-tag matching (no commercial data)
  // ──────────────────────────────────────────────────────────

  /**
   * Match creators against a user aesthetic profile.
   * Returns all matches sorted by totalScore descending.
   * Scoring: styleScore (40%) + faceScore (35%) + colorScore (25%)
   * No fan counts, likes, or any commercial metric is used.
   */
  matchCreators(user: UserAestheticProfile, creators: CreatorProfile[]): CreatorMatchResult[] {
    const results: CreatorMatchResult[] = [];

    for (const creator of creators) {
      const styleScore = this._calcStyleScore(user.stylePreference, creator.styleTags);
      const faceScore = this._calcFaceScore(user.faceShape, creator.faceShapeTags);
      const colorScore = this._calcColorScoreFromProfile(user.skinTone, user.makeupPreference, creator.colorTags);
      const totalScore = Math.round(
        styleScore * 0.40 +
        faceScore * 0.35 +
        colorScore * 0.25
      );

      const matchReasons = this._generateMatchReasons(user, creator, { styleScore, faceScore, colorScore, totalScore });

      results.push({
        ...creator,
        matchScore: { styleScore, faceScore, colorScore, totalScore },
        matchReasons
      });
    }

    return results.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore);
  }

  /**
   * Return the Top-3 best-matching creators.
   */
  getTop3Creators(user: UserAestheticProfile, creators: CreatorProfile[]): CreatorMatchResult[] {
    return this.matchCreators(user, creators).slice(0, 3);
  }

  // ──────────────────────────────────────────────────────────
  // Scoring helpers
  // ──────────────────────────────────────────────────────────

  /**
   * Style match: checks if user's stylePreference appears in creator's styleTags.
   * Supports partial string matching for Chinese style names.
   */
  private _calcStyleScore(userStyle: string, creatorStyles: string[]): number {
    if (creatorStyles.length === 0) return 30;
    // Direct match
    if (creatorStyles.some(s => s === userStyle)) return 100;
    // Partial match (e.g. "自然" in "清透自然型")
    const match = creatorStyles.some(s => s.includes(userStyle) || userStyle.includes(s));
    if (match) return 75;
    return 30;
  }

  /**
   * Face shape match: exact tag match or "所有脸型" wildcard.
   */
  private _calcFaceScore(userFaceShape: FaceShapeTag, creatorFaceShapes: FaceShapeTag[]): number {
    if (creatorFaceShapes.includes("所有脸型")) return 100;
    if (creatorFaceShapes.includes(userFaceShape)) return 100;
    return 30;
  }

  /**
   * Color match: checks skinTone and makeup preference against creator's colorTags.
   * Skin tone match = strong signal; makeup color preference = complementary signal.
   */
  private _calcColorScoreFromProfile(userSkinTone: string, userMakeupPref: string, creatorColorTags: ColorTag[]): number {
    if (creatorColorTags.length === 0) return 30;

    const toneMatch = creatorColorTags.some(
      t => t === userSkinTone ||
           (userSkinTone === "中性皮" && (t === "暖皮" || t === "冷皮" || t === "中性皮")) ||
           (t === "中性皮" && (userSkinTone === "暖皮" || userSkinTone === "冷皮"))
    );

    const makeupColorKeywords: Record<string, string[]> = {
      "奶茶色": ["奶茶色"],
      "豆沙色": ["豆沙色"],
      "裸粉色": ["裸粉色"],
      "橘棕色": ["橘棕色"],
      "玫瑰色": ["玫瑰色"],
      "珊瑚红": ["珊瑚红"],
      "香槟金": ["香槟金"]
    };

    const prefColors = makeupColorKeywords[userMakeupPref as keyof typeof makeupColorKeywords] || [];
    const colorTag = creatorColorTags.filter(t => t !== "暖皮" && t !== "冷皮" && t !== "中性皮");
    const colorMatch = prefColors.length > 0
      ? prefColors.some(c => (colorTag as string[]).includes(c))
      : colorTag.some(t => t === userSkinTone || (["奶茶色", "豆沙色", "裸粉色", "玫瑰色"] as string[]).includes(t));

    if (toneMatch && colorMatch) return 100;
    if (toneMatch || colorMatch) return 65;
    return 30;
  }

  // ──────────────────────────────────────────────────────────
  // Reason generation
  // ──────────────────────────────────────────────────────────

  private _generateMatchReasons(
    user: UserAestheticProfile,
    creator: CreatorProfile,
    scores: CreatorMatchScore
  ): string[] {
    const reasons: string[] = [];

    if (scores.styleScore >= 90) {
      const matchedStyle = creator.styleTags.find(s => s === user.stylePreference);
      if (matchedStyle) reasons.push(`与您的${matchedStyle}风格高度契合`);
    } else if (scores.styleScore >= 70) {
      reasons.push(`风格与您的审美偏好一致`);
    }

    if (scores.faceScore >= 90) {
      reasons.push(`脸型适配，${user.faceShape}脸能很好地驾驭该达人风格`);
    }

    if (scores.colorScore >= 80) {
      reasons.push(`色彩推荐与您的肤色和偏好匹配`);
    } else if (scores.colorScore >= 50) {
      reasons.push("色彩方向基本吻合");
    }

    if (scores.totalScore >= 85) {
      reasons.push("综合审美匹配度很高，推荐参考");
    } else if (scores.totalScore >= 65) {
      reasons.push("审美风格较为匹配，值得参考");
    }

    if (reasons.length === 0) {
      reasons.push("达人风格与您有一定重合度");
    }

    return reasons;
  }

  // ──────────────────────────────────────────────────────────
  // Legacy V2 helpers (for matchBloggers)
  // ──────────────────────────────────────────────────────────

  private _calcFaceMetricsScore(userMetrics: Record<string, number>, _bloggerRange?: unknown): number {
    return 60; // placeholder; full FaceMetrics implementation in MatchingScore.ts
  }

  private _calcMakeupStyleScore(userStyle: string, bloggerStyles?: string[]): number {
    if (!bloggerStyles || bloggerStyles.length === 0) return 50;
    return bloggerStyles.some(s => s === userStyle || s.includes(userStyle) || userStyle.includes(s)) ? 100 : 30;
  }

  private _calcColorScore(userColors: string[], bloggerColors?: string[]): number {
    if (!bloggerColors || bloggerColors.length === 0 || userColors.length === 0) return 50;
    const overlap = userColors.filter(c => bloggerColors.some(bc => bc.includes(c) || c.includes(bc))).length;
    return Math.round((overlap / userColors.length) * 100);
  }

  private _calcFacialFeaturesScore(userEye: string, userLip: string, _bloggerEyes?: string[], _bloggerLips?: string[]): number {
    return 50; // placeholder
  }

  private _calcScenarioScore(userStyle: string, _bloggerScenario?: string): number {
    const map: Record<string, string> = {
      "清透自然型": "日常通勤",
      "欧美浓妆型": "派对晚宴",
      "韩系甜妹型": "甜美约会",
      "成熟御姐型": "商务职场",
      "日系清新型": "清新校园"
    };
    return map[userStyle] ? 80 : 50;
  }
}



