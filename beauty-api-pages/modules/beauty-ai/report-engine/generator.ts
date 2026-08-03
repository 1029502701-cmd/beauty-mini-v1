// ============================================
// ReportGenerator V2 – Rule-based beauty report generation
// Migrated from cloudflare-worker/lib/reportGenerator.ts (TASK-Beauty-V8-Migrate-004)
//
// Three-tier report levels:
//   first-look   (Level 1 / 基础报告)  – faceInsight only
//   style-upgrade (Level 2 / 美学分析报告) – + seasonColorAnalysis + styleUpgradeContent
//   beauty-pro   (Level 3 / Token专属报告) – + personalPlan
// ============================================
import type {
  BeautyFaceMetrics,
  BeautyFaceMetricsExtended,
  BeautyReportContentV2,
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
} from "../types/beauty";

import {
  FACE_SHAPE_RULES,
  FACE_SHAPE_TARGETS,
  buildFaceInsight,
} from "./face-rules/index.js";
import { SEASON_COLOR_RULES, getSeasonColorAnalysis } from "./color-rules/index.js";
import {
  EYE_TYPE_RULES,
  inferSkinToneCategory,
  getFoundationTip,
  inferSeasonColorType,
} from "./style-rules/index.js";

import type { ReportLevel } from "./types";
import type { BeautyDecisionAnswers } from "../types/beauty";
import type { BeautyDecisionAnswers } from "../types/beauty";

/**
 * ReportGenerator – orchestrates V2 rule-based report generation.
 *
 * Supports three report levels via generateV2():
 *   Level 1 (first-look):   basic face insight report
 *   Level 2 (style-upgrade): full aesthetic analysis with color + style
 *   Level 3 (beauty-pro):   token-locked comprehensive report with personal plan
 */
export class ReportGenerator {
  /**
   * Classify face shape from extended metrics using distance-based scoring.
   */
  classifyFaceShape(metrics: BeautyFaceMetricsExtended): FaceShapeResult {
    const { faceWidth, faceHeight, jawWidth } = metrics;
    const faceHWRatio = faceHeight > 0 ? faceWidth / faceHeight : 0.75;
    const jawRatio    = faceWidth > 0 ? jawWidth / faceWidth : 0.75;
    const chinRatio   = faceHeight > 0 ? (metrics.chinLength ?? (faceHeight * 0.30)) / faceHeight : 0.32;

    const scores: Record<string, number> = {};
    for (const [shape, t] of Object.entries(FACE_SHAPE_TARGETS)) {
      scores[shape] =
        Math.pow(faceHWRatio - t.fhr, 2) * 4 +
        Math.pow(jawRatio    - t.jr, 2) * 5 +
        Math.pow(chinRatio   - t.cr, 2) * 4;
    }

    const maxDist = Math.max(...Object.values(scores));
    const inverted: Record<string, number> = {};
    for (const [shape, dist] of Object.entries(scores)) {
      inverted[shape] = maxDist > 0 ? (maxDist - dist) / maxDist : 0.2;
    }

    let bestShape = "鹅蛋脸";
    let bestScore = 0;
    for (const [shape, score] of Object.entries(inverted)) {
      if (score > bestScore) {
        bestScore = score;
        bestShape = shape;
      }
    }

    return {
      faceShape: bestShape,
      confidence: parseFloat(bestScore.toFixed(2))
    };
  }

  /**
   * Generate full V2 beauty report content.
   *
   * @param analysisId – unique analysis/report ID
   * @param metrics    – BeautyFaceMetrics (may include extended fields)
   * @param userProfile – optional user profile hint
   * @param level      – "first-look" | "style-upgrade" | "beauty-pro"
   */
  async generateV2(
    analysisId: string,
    metrics: BeautyFaceMetrics,
    userProfile?: { skinTone?: string },
    level: ReportLevel = "first-look",
    decisions?: BeautyDecisionAnswers,
  ): Promise<BeautyReportContentV2> {
    const extendedMetrics = metrics as unknown as BeautyFaceMetricsExtended;
    const isExtended = "faceWidth" in extendedMetrics;

    // ---- face shape classification ----
    const faceShapeResult = isExtended
      ? this.classifyFaceShape(extendedMetrics)
      : { faceShape: metrics.faceShape, confidence: 0.75 };

    const shape = faceShapeResult.faceShape;
    const faceRule = FACE_SHAPE_RULES[shape] || FACE_SHAPE_RULES["鹅蛋脸"];
    const skinToneCat = inferSkinToneCategory(metrics.skinTone);
    const skinTone = metrics.skinTone;

    // ---- faceInsight (all levels) ----
    const faceInsight = buildFaceInsight(shape, metrics.eyeType);

    // ---- featureHighlights ----
    const features = this.buildFeatureHighlights(extendedMetrics, metrics);

    // ---- colorAnalysis (season + palette) ----
    const seasonType = inferSeasonColorType(skinTone, skinToneCat);
    const seasonAnalysis = getSeasonColorAnalysis(seasonType);
    const colorAnalysis: ColorAnalysis = {
      skinTone,
      skinToneCategory: skinToneCat,
      recommendedColors: faceRule.palette,
      avoidColors: faceRule.avoidColors,
      foundationTip: getFoundationTip(skinTone),
      seasonType: seasonAnalysis.seasonType,
      dailyColors: seasonAnalysis.dailyColors,
      specialColors: seasonAnalysis.specialColors,
    };

    // ---- makeupStyle ----
    const makeupStyle: MakeupStyleSuggestion = {
      primaryStyle: faceRule.style,
      secondaryStyles: faceRule.styles.slice(1, 3),
      occasion: this.mapOccasion(level),
      confidence: faceShapeResult.confidence,
    };

    // ---- makeupStyleDetail (enhanced) ----
    const makeupStyleDetail: MakeupStyleDetail = {
      styleName: faceRule.makeupStyleName,
      reason: faceRule.reason,
      suitableOccasion: faceRule.suitableOccasion,
      keyPoints: faceRule.elements,
      avoidTips: faceRule.avoidPatterns,
    };

    // ---- styleDirection ----
    const styleDirection: StyleDirection = {
      overallDirection: faceRule.direction,
      keyElements: faceRule.elements,
      avoidPatterns: faceRule.avoidPatterns,
      vibeDescription: faceRule.description,
    };

    // ---- faceAnalysis ----
    const faceAnalysis: FaceAnalysisSection = {
      faceShape: shape,
      faceRatio: metrics.faceRatio,
      symmetryScore: this.calculateEyeSymmetry(metrics),
      description: `${shape}比例${metrics.faceRatio.toFixed(2)}，${faceRule.description}，分析置信度 ${(faceShapeResult.confidence * 100).toFixed(0)}%`,
      highlightPoints: [
        `脸型特征：${shape}，比例协调，置信度 ${(faceShapeResult.confidence * 100).toFixed(0)}%`,
        `眼型特点：${metrics.eyeType}`,
      ].concat(
        isExtended ? [
          `面部宽高比：${extendedMetrics.faceWidth.toFixed(1)}:${extendedMetrics.faceHeight.toFixed(1)}`,
          `下颌宽度比：${((extendedMetrics.jawWidth / extendedMetrics.faceWidth) * 100).toFixed(0)}%`,
          `眼宽比例：${extendedMetrics.eyeWidth > 0 ? (extendedMetrics.eyeWidth / extendedMetrics.faceWidth * 100).toFixed(0) : "N/A"}%`,
          `鼻翼比例：${extendedMetrics.noseWidth > 0 ? (extendedMetrics.noseWidth / extendedMetrics.faceWidth * 100).toFixed(0) : "N/A"}%`,
          `唇宽比例：${extendedMetrics.lipWidth > 0 ? (extendedMetrics.lipWidth / extendedMetrics.noseWidth * 100).toFixed(0) : "N/A"}%`,
        ] : []
      ).filter((v): v is string => v !== undefined),
    };

    // ---- colorRecommendation (v1 compat) ----
    const colorRecommendation: ColorRecommendationSection = {
      skinToneCategory: skinToneCat,
      recommendedPalette: faceRule.palette,
      avoidColors: faceRule.avoidColors,
      foundationTip: getFoundationTip(skinTone),
    };

    // ---- Level-specific sections ----
    const baseResult: BeautyReportContentV2 = {
      faceAnalysis,
      faceShapeResult,
      featureHighlights: features,
      makeupStyle,
      makeupStyleDetail,
      colorRecommendation,
      colorAnalysis,
      styleDirection,
      productRecommendation: [],
      generatedAt: new Date().toISOString(),
      version: "v2",
      faceInsight,
    };

    // Level 2: style-upgrade – add season color + style upgrade content
    if (level === "style-upgrade" || level === "beauty-pro") {
      const seasonRule = Object.values(SEASON_COLOR_RULES).find(r => r.seasonType === seasonType)
        || SEASON_COLOR_RULES["春季型"];
      const seasonColorAnalysis: SeasonColorAnalysis = {
        seasonType: seasonRule.seasonType,
        dailyColors: seasonRule.dailyColors,
        specialColors: seasonRule.specialColors,
        seasonDescription: seasonRule.seasonDescription,
      };

      const eyeStrengths = (faceInsight.strengths[0]) || "突出眼型特点";
      const styleUpgradeContent = {
        styleRecommendations: [
          `主打${faceRule.makeupStyleName}风格，核心是${faceRule.direction}`,
          ...faceRule.styles.slice(1, 3).map(s => `备选风格：${s}`),
        ],
        eyeMakeupDirection: `眼妆以${eyeStrengths}为主，配合${faceRule.elements[2] || "自然眉形"}`,
        contourDirection: `修容方向：${faceRule.direction}`,
        lipColorDirection: `唇色推荐：${faceRule.palette.slice(0, 2).join("、")}`,
      };

            if (level === "beauty-pro") {
        const personalPlan = this.buildPersonalPlan(shape, faceRule, faceInsight, seasonType, metrics, decisions);
        return { ...baseResult, seasonColorAnalysis, styleUpgradeContent, personalPlan };
      }

      return { ...baseResult, seasonColorAnalysis, styleUpgradeContent };
    }

    // Level 1: first-look – only faceInsight (baseResult already has it)
    return baseResult;
  }

  /**
   * Legacy generate() – delegates to generateV2 and returns v1-compatible wrapper.
   * Kept for backward compatibility with existing callers.
   */
  async generate(
    analysisId: string,
    metrics: import("../face-types").FaceMetrics,
    userProfile?: import("./types").UserProfile,
    reportLevel: ReportLevel = "first-look",
  ): Promise<import("./types").BeautyReport> {
    // Convert FaceMetrics -> BeautyFaceMetrics for the V2 engine
    const beautyMetrics: BeautyFaceMetrics = {
      faceShape: metrics.faceType || "鹅蛋脸",
      faceRatio: metrics.faceRatio,
      eyeType: "杏眼",
      eyeSize: 0,
      noseRatio: 0.4,
      lipRatio: 0.3,
      jawType: "标准颌型",
      skinTone: "中性",
    };

    const v2 = await this.generateV2(analysisId, beautyMetrics, userProfile, reportLevel);

    // Map V2 -> legacy v1 BeautyReport shape
    return {
      analysisId,
      reportLevel,
      title: this.getTitle(reportLevel, beautyMetrics.faceShape),
      faceSummary: {
        title: "脸型分析",
        content: [v2.faceAnalysis?.description ?? ""],
      },
      makeupStyle: {
        title: "妆容风格",
        content: [v2.makeupStyleDetail?.styleName ?? "", v2.makeupStyleDetail?.reason ?? ""],
      },
      colorAdvice: {
        title: "色彩建议",
        content: [
          `推荐色系：${(v2.colorAnalysis?.recommendedColors ?? []).join("、")}`,
          `避免色彩：${(v2.colorAnalysis?.avoidColors ?? []).join("、")}`,
        ],
      },
      productAdvice: { title: "产品建议", content: [] },
      beautyPlan: { title: "美容计划", content: [] },
      createdAt: v2.generatedAt,
    };
  }

  private getTitle(level: ReportLevel, shape: string): string {
    const prefixes: Record<ReportLevel, string> = {
      "first-look":    "你的美丽第一印象",
      "style-upgrade": "个人风格升级指南",
      "beauty-pro":    "专业美妆报告",
    };
    return `${prefixes[level]} — ${shape}脸型 profile`;
  }

  private calculateEyeSymmetry(metrics: BeautyFaceMetrics): number {
    if (metrics.eyeSize > 0) {
      return Math.min(0.95, 0.7 + (metrics.eyeSize / 100));
    }
    return 0.85;
  }

  private mapOccasion(level: ReportLevel): "daily" | "formal" | "evening" | "special" {
    switch (level) {
      case "style-upgrade": return "formal";
      case "beauty-pro":    return "special";
      default:              return "daily";
    }
  }

  private buildPersonalPlan(
    shape: string,
    faceRule: import("../types/beauty").FaceShapeRule,
    faceInsight: FaceInsight,
    seasonType: string,
    metrics: BeautyFaceMetrics,
    decisions?: BeautyDecisionAnswers,
  ): import("../types/beauty").PersonalBeautyPlan {
    const style = decisions?.style || "natural";
    const occasion = decisions?.occasion || "daily";
    const tolerance = decisions?.tolerance || "normal";

    const routineDepth = tolerance === "conservative" ? 3 : tolerance === "bold" ? 6 : 4;
    const routineSteps = this.buildMakeupRoutine(shape, metrics, style, occasion, routineDepth);
    const actionItems = this.buildActionItems(shape, faceInsight, seasonType, style, occasion, tolerance);
    const beautyTips = this.buildBeautyTips(shape, faceRule, seasonType, tolerance);
    const signatureLook = this.buildSignatureLook(shape, faceRule, seasonType, style, occasion);

    return { actionItems, makeupRoutine: routineSteps, beautyTips, signatureLook };
  }

  private buildActionItems(
    shape: string, faceInsight: FaceInsight, seasonType: string,
    style: string, occasion: string, tolerance: string,
  ): string[] {
    const focusArea = faceInsight.concerns[0] || "面部比例";
    const strengthArea = faceInsight.strengths[0] || "五官协调";
    return [
      `重点优化：${focusArea}`,
      `发挥优势：${strengthArea}`,
      `色彩选择：遵循${seasonType}四季色彩体系`,
      `风格定位：${style}风格，适合${occasion}场景`,
    ];
  }

  private buildMakeupRoutine(shape: string, metrics: BeautyFaceMetrics, style: string, occasion: string, depth: number): string[] {
    const steps: string[] = [];
    steps.push("Step 1: 清透底妆 - 根据肤色选择粉底");
    steps.push("Step 2: 修容定调 - 按照脸型轮廓进行修容");
    if (depth >= 3) steps.push("Step 3: 眼妆重点 - 突出" + metrics.eyeType + "特点");
    if (depth >= 4) steps.push("Step 4: 唇妆点睛 - 选择" + (style === "charismatic" ? "正红色系" : style === "individual" ? "个性撞色" : "豆沙色系") + "唇色");
    if (depth >= 5) steps.push("Step 5: 定妆锁妆 - 根据场合选择定妆方式");
    if (depth >= 6) steps.push("Step 6: 细节完善 - 眉形与高光最后调整");
    return steps;
  }

  private buildBeautyTips(shape: string, faceRule: import("../types/beauty").FaceShapeRule, seasonType: string, tolerance: string): string[] {
    const tips: string[] = [];
    tips.push("你的" + shape + "脸型搭配" + seasonType + "四季色彩体系效果最佳");
    tips.push("建议重点突出" + faceRule.makeupStyleName + "风格特点");
    if (tolerance === "conservative") {
      tips.push("小范围调整即可提升整体妆容质感");
    } else if (tolerance === "bold") {
      tips.push("可以尝试更大胆的妆容配色和造型");
    } else {
      tips.push("可根据场合灵活调整妆容强度");
    }
    return tips;
  }

  private buildSignatureLook(shape: string, faceRule: import("../types/beauty").FaceShapeRule, seasonType: string, style: string, occasion: string): string {
    const styleModifiers: Record<string, string> = {
      natural: "自然裸妆",
      refined: "精致妆容",
      charismatic: "气场妆容",
      individual: "个性妆容",
    };
    return faceRule.makeupStyleName + " + " + seasonType + "色彩体系 + " + (styleModifiers[style] || "精致妆容") + " = 你的" + occasion + "专属风格";
  }

    private buildFeatureHighlights(
    metrics: BeautyFaceMetricsExtended,
    base: BeautyFaceMetrics,
  ): FeatureHighlight[] {
    const eyeTypeData = EYE_TYPE_RULES[base.eyeType] || EYE_TYPE_RULES["杏眼"];

    return [
      {
        feature: "eyes",
        shape: base.eyeType,
        measurement: metrics.eyeWidth > 0
          ? `眼宽${metrics.eyeWidth.toFixed(1)}，眼型${base.eyeType}，占比${(metrics.eyeWidth / metrics.faceWidth * 100).toFixed(0)}%`
          : `眼距适中，眼型${base.eyeType}`,
        recommendation: eyeTypeData.recommendation,
      },
      {
        feature: "nose",
        shape: base.noseRatio < 0.4 ? "精致小鼻" : base.noseRatio < 0.5 ? "标准鼻型" : "挺直鼻梁",
        measurement: metrics.noseWidth > 0
          ? `鼻翼宽${metrics.noseWidth.toFixed(1)}，比例${base.noseRatio.toFixed(2)}`
          : `鼻翼比例${base.noseRatio.toFixed(2)}`,
        recommendation: "保持鼻梁自然立体感",
      },
      {
        feature: "lips",
        shape: base.lipRatio < 0.25 ? "小巧嘴唇" : base.lipRatio < 0.35 ? "标准唇形" : "饱满双唇",
        measurement: metrics.lipWidth > 0
          ? `唇宽${metrics.lipWidth.toFixed(1)}，比例${base.lipRatio.toFixed(2)}`
          : `唇宽比例${base.lipRatio.toFixed(2)}`,
        recommendation: "选择与色系搭配的唇妆产品",
      },
      {
        feature: "brows",
        shape: base.jawType === "宽大颌型" ? "上扬眉" : "自然眉",
        measurement: metrics.jawWidth > 0
          ? `颌型${base.jawType}，下颌宽${metrics.jawWidth.toFixed(1)}`
          : `颌型${base.jawType}`,
        recommendation: "根据脸型选择眉形",
      },
    ];
  }
}

export default ReportGenerator;

