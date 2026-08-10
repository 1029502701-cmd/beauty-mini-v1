import type {
  CreatorProfile,
  CreatorMatchResult,
  CreatorMatchScore,
  FaceShapeTag,
  ColorTag
} from "@/types/beauty";

export interface UserAestheticProfile {
  faceShape: FaceShapeTag;
  skinTone: string;
  makeupPreference: string;
  stylePreference: string;
}

export class BloggerMatcher {
  // 权重: 脸型五官 50%, 妆容 30%, 标签体系 20%
  private weights: { style: number; face: number; tags: number };

  constructor() {
    this.weights = { style: 30, face: 50, tags: 20 };
  }

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
    const tagsScore = this._calcTagsScore(userReport.colorRecommendation, userReport.skinTone, userReport.makeupStyle, blogger.colorSupports as string[], blogger.targetAudience as string);

    const detailedScores = {
      faceMetrics: faceMetricsScore,
      makeupStyle: makeupStyleScore,
      tags: tagsScore
    };

    const totalScore =
      (detailedScores.faceMetrics * 0.50) +
      (detailedScores.makeupStyle * 0.30) +
      (detailedScores.tags * 0.20);

    const matchReasons: string[] = [];
    if (makeupStyleScore >= 80) matchReasons.push(`适合${userReport.makeupStyle}风格`);
    if (faceMetricsScore >= 75) matchReasons.push("脸型五官适配度高");
    if (tagsScore >= 70) matchReasons.push("色彩与场景标签匹配");
    if (matchReasons.length === 0) matchReasons.push("达人风格与您的要求匹配");

    return {
      bloggerId: blogger.id as string,
      score: Math.min(100, Math.round(totalScore)),
      matchReasons,
      matchDetails: detailedScores
    };
  }

  matchCreators(user: UserAestheticProfile, creators: CreatorProfile[]): CreatorMatchResult[] {
    const results: CreatorMatchResult[] = [];
    for (const creator of creators) {
      const styleScore = this._calcStyleScoreFromProfile(user.stylePreference, creator.styleTags);
      const faceScore = this._calcFaceScoreFromProfile(user.faceShape, creator.faceShapeTags);
      const colorScore = this._calcColorScoreFromProfile(user.skinTone, user.makeupPreference, creator.colorTags);
      const totalScore = styleScore * 0.30 + faceScore * 0.50 + colorScore * 0.20;

      const scores: CreatorMatchScore = { styleScore, faceScore, colorScore, totalScore: Math.min(100, Math.round(totalScore)) };
      const matchReasons = this._generateMatchReasons(user, creator, scores);

      results.push({
        ...creator,
        matchScore: scores,
        matchReasons
      });
    }
    return results.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore);
  }

  getWeightConfig(): { style: number; face: number; tags: number } {
    return this.weights;
  }

  private _calcFaceMetricsScore(userMetrics: Record<string, number>, _bloggerRange?: unknown): number {
    return 60;
  }

  private _calcMakeupStyleScore(userStyle: string, bloggerStyles?: string[]): number {
    if (!bloggerStyles || bloggerStyles.length === 0) return 50;
    return bloggerStyles.some(s => s === userStyle || s.includes(userStyle) || userStyle.includes(s)) ? 100 : 30;
  }

  private _calcTagsScore(
    userColors: string[],
    userSkinTone: string,
    userMakeupStyle: string,
    bloggerColors?: string[],
    bloggerScenario?: string
  ): number {
    let score = 0;
    let factors = 0;

    // Color match (part of tags, 10% of total)
    if (bloggerColors && bloggerColors.length > 0 && userColors.length > 0) {
      const overlap = userColors.filter(c => bloggerColors.some(bc => bc.includes(c) || c.includes(bc))).length;
      score += (overlap / userColors.length) * 100 * 0.5;
      factors += 0.5;
    } else {
      score += 50 * 0.5;
      factors += 0.5;
    }

    // Scenario match (part of tags, 10% of total)
    const map: Record<string, string> = {
      "清透自然型": "日常通勤",
      "欧美浓妆型": "派对晚宴",
      "韩系甜妹型": "甜美约会",
      "成熟御姐型": "商务职场",
      "日系清新型": "清新校园"
    };
    const expected = map[userMakeupStyle] || "";
    if (bloggerScenario && expected.includes(bloggerScenario)) {
      score += 100 * 0.5;
    } else if (bloggerScenario) {
      score += 50 * 0.5;
    } else {
      score += 50 * 0.5;
    }
    factors += 0.5;

    return factors > 0 ? Math.round(score / factors) : 50;
  }

  private _calcStyleScoreFromProfile(userStyle: string, creatorTags: string[]): number {
    if (creatorTags.length === 0) return 30;
    return creatorTags.some(t => t === userStyle || userStyle.includes(t) || t.includes(userStyle)) ? 100 : 40;
  }

  private _calcFaceScoreFromProfile(userFaceShape: FaceShapeTag, creatorFaceShapes: FaceShapeTag[]): number {
    if (creatorFaceShapes.length === 0) return 30;
    if (creatorFaceShapes.includes("所有脸型")) return 100;
    return creatorFaceShapes.includes(userFaceShape) ? 100 : 30;
  }

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

  private _generateMatchReasons(
    user: UserAestheticProfile,
    creator: CreatorProfile,
    scores: CreatorMatchScore
  ): string[] {
    const reasons: string[] = [];
    if (scores.faceScore >= 80) {
      reasons.push(`脸型适配，${user.faceShape}脸能很好地驾驭该达人风格`);
    }
    if (scores.styleScore >= 80) {
      reasons.push(`与您的${user.stylePreference}风格高度契合`);
    }
    if (scores.colorScore >= 70) {
      reasons.push(`色彩推荐与您的肤色和偏好匹配`);
    }
    if (scores.totalScore >= 85) {
      reasons.push("综合匹配度高，强烈推荐");
    } else if (scores.totalScore >= 65) {
      reasons.push("风格较为匹配，值得参考");
    }
    if (reasons.length === 0) {
      reasons.push("达人风格与您有一定重合度");
    }
    return reasons;
  }
}