// ============================================
// BeautyReportGenerator - Rule-based report generation from BeautyFaceMetrics
// ============================================
import type {
  BeautyFaceMetrics,
  BeautyFaceMetricsExtended,
  BeautyReportContent,
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
  StyleUpgradeContent,
  PersonalBeautyPlan,
} from "../types/beauty";

/**
 * Rule engine knowledge base for face shape -> makeup recommendations
 */
const FACE_SHAPE_RULES: Record<string, {
  style: string;
  styles: string[];
  palette: string[];
  avoidColors: string[];
  direction: string;
  elements: string[];
  avoidPatterns: string[];
  description: string;
  makeupStyleName: string;
  reason: string;
  suitableOccasion: string;
}> = {
  "圆脸": {
    style: "显瘦立体型",
    styles: ["立体修容妆", "清透自然型", "韩系水光肌"],
    palette: ["奶茶色", "大地色", "玫瑰棕", "豆沙色"],
    avoidColors: ["荧光粉", "亮橙色"],
    direction: "通过修容拉长脸部轮廓，突出五官立体感",
    elements: ["修容高光盘", "竖形眼线", "自然眉峰"],
    avoidPatterns: ["横向腮红", "平眉", "大volume眼影"],
    description: "适合侧光和纵向线条妆容，避免横向拉宽脸部",
    makeupStyleName: "立体修容妆",
    reason: "圆脸轮廓柔和，通过纵向修容和立体阴影拉长脸型，突出五官立体感",
    suitableOccasion: "日常通勤、约会、宴会"
  },
  "长脸": {
    style: "柔和缩短型",
    styles: ["韩系甜美型", "日系清新型", "温柔无辜眼妆"],
    palette: ["蜜桃粉", "珊瑚橘", "浅杏色", "浅棕色"],
    avoidColors: ["深棕色", "烟熏黑"],
    direction: "通过横向扩宽视觉，缩短中庭比例",
    elements: ["横向腮红", "卧蚕", "弧度眉形"],
    avoidPatterns: ["高额头露发", "长直眉", "深色眼影"],
    description: "适合增加面部宽度感的妆容，避免纵向拉长",
    makeupStyleName: "韩系甜美妆",
    reason: "长脸中庭偏长，通过横向腮红和卧蚕缩短视觉比例，增加甜美柔和感",
    suitableOccasion: "日常通勤、休闲、约会"
  },
  "方脸": {
    style: "柔美调和型",
    styles: ["成熟御姐型", "港风复古型", "柔雾哑光妆"],
    palette: ["砖红色", "酒红色", "琥珀色", "暖驼色"],
    avoidColors: ["冷紫色", "荧光色"],
    direction: "柔化下颌线条，突出眉眼优势",
    elements: ["柔和眉形", "珠光高光", "饱满唇妆"],
    avoidPatterns: ["直角眉峰", "方正下颌线强调", "哑光底妆"],
    description: "适合柔和曲线和暖调色彩，弱化骨骼感",
    makeupStyleName: "柔雾哑光妆",
    reason: "方脸骨骼感强，通过柔和眉形和哑光底妆弱化下颌线条，突出眉眼优势",
    suitableOccasion: "正式场合、晚宴、商务"
  },
  "心形脸": {
    style: "甜美平衡型",
    styles: ["韩系水光肌", "日系透明感", "元气少女妆"],
    palette: ["蜜桃粉", "珊瑚红", "香槟金", "裸粉色"],
    avoidColors: ["深酒红", "姨妈色"],
    direction: "平衡上宽下窄，突出苹果肌",
    elements: ["饱满苹果肌", "圆润眼线", "嘟嘟唇效"],
    avoidPatterns: ["浓重眉峰", "V型修容", "上重下轻妆容"],
    description: "适合饱满柔和的元气妆容，突出甜美气质",
    makeupStyleName: "元气少女妆",
    reason: "心形脸上宽下窄，通过饱满苹果肌和圆润眼线下移视觉重心，平衡脸型",
    suitableOccasion: "日常、约会、聚会"
  },
  "鹅蛋脸": {
    style: "清透自然型",
    styles: ["清透自然型", "知性通勤妆", "日杂透明感"],
    palette: ["奶茶色", "玫瑰粉", "香槟金", "珊瑚橘"],
    avoidColors: [],
    direction: "标准脸型适配多种风格，突出皮肤质感",
    elements: ["清透底妆", "自然眉眼", "滋润唇部"],
    avoidPatterns: ["厚重假面感", "夸张轮廓"],
    description: "标准脸型，几乎适合所有妆容风格",
    makeupStyleName: "清透自然妆",
    reason: "鹅蛋脸比例标准，突出皮肤原生质感即可，无需过多修容调整",
    suitableOccasion: "日常通勤、休闲、约会"
  }
};

const EYE_TYPE_RULES: Record<string, {
  recommendation: string;
  techniques: string[];
}> = {
  "杏眼": { recommendation: "突出圆润可爱的眼睛特点", techniques: ["下垂眼线", "卧蚕提亮", "自然卷翘睫毛"] },
  "单眼皮": { recommendation: "强调眼型线条感", techniques: ["消肿哑光眼影", "内眼线", "夹翘睫毛"] },
  "不对称眼": { recommendation: "通过妆容平衡双眼", techniques: ["调整眼距眼线", "单边矫正眼影"] }
};

/**
 * Target ratios for each face shape (used for distance-based classification).
 */
const FACE_SHAPE_TARGETS: Record<string, { fhr: number; jr: number; cr: number }> = {
  "鹅蛋脸": { fhr: 0.67, jr: 0.72, cr: 0.30 },
  "圆脸":   { fhr: 0.90, jr: 0.88, cr: 0.25 },
  "方脸":   { fhr: 0.80, jr: 0.92, cr: 0.30 },
  "心形脸": { fhr: 0.75, jr: 0.60, cr: 0.22 },
  "长脸":   { fhr: 0.55, jr: 0.68, cr: 0.40 },
};

// ============================================================
//  TASK-BeautyMini-059新增：四季色彩匹配规则
// ============================================================
const SEASON_COLOR_RULES: Record<string, {
  seasonType: string;
  dailyColors: string[];
  specialColors: string[];
  seasonDescription: string;
  skinToneKeywords: string[];
}> = {
  "春季型": {
    seasonType: "spring",
    dailyColors: ["珊瑚橘", "蜜桃粉", "奶油黄", "浅金棕"],
    specialColors: ["玫瑰金", "橙红色", "暖金色"],
    seasonDescription: "暖调明亮的春季色彩，适合暖黄皮，带来元气活力感",
    skinToneKeywords: ["暖", "黄"]
  },
  "夏季型": {
    seasonType: "summer",
    dailyColors: ["薰衣草紫", "柔粉色", "冰蓝色", "玫瑰粉"],
    specialColors: ["梅子色", "薰衣草紫红", "冰玫瑰"],
    seasonDescription: "柔和冷调的夏季色彩，适合冷白皮，带来清新温柔气质",
    skinToneKeywords: ["冷", "白"]
  },
  "秋季型": {
    seasonType: "autumn",
    dailyColors: ["焦糖棕", "砖红", "橄榄绿", "驼色"],
    specialColors: ["酒红", "金铜色", "深琥珀"],
    seasonDescription: "温暖浓郁的秋季色彩，适合中性及橄榄皮，带来复古优雅感",
    skinToneKeywords: ["橄榄", "中性"]
  },
  "冬季型": {
    seasonType: "winter",
    dailyColors: ["正红色", "宝蓝色", "纯白色", "黑色"],
    specialColors: ["祖母绿", "深紫红", "金属银"],
    seasonDescription: "对比鲜明的冬季色彩，适合冷调肤色，带来高级冷艳感",
    skinToneKeywords: ["冷", "白", "橄榄"]
  }
};

// ============================================================
//  TASK-BeautyMini-059新增：面部洞察（FaceInsight）规则
// ============================================================
const FACE_INSIGHT_RULES: Record<string, {
  faceShape: string;
  strengths: string[];
  concerns: string[];
  summaryTemplate: string;
  eyeStrengths: Record<string, string[]>;
  eyeConcerns: Record<string, string[]>;
}> = {
  "圆脸": {
    faceShape: "圆脸",
    strengths: ["脸颊饱满有少女感", "轮廓柔和显年轻", "笑容时苹果肌饱满"],
    concerns: ["面部轮廓偏短，可通过修容拉长", "下颌线条不明显"],
    summaryTemplate: "面部轮廓柔和饱满，苹果肌发育良好，整体气质偏向甜美可爱。面部比例均衡，通过纵向修容可进一步优化脸型。",
    eyeStrengths: { "杏眼": ["眼睛圆润可爱，天然增加亲和力"], "单眼皮": ["眼型线条干净，适合打造清透妆效"], "不对称眼": ["眼部基础条件良好，可通过眼线微调平衡"] },
    eyeConcerns: { "杏眼": [], "单眼皮": ["可通过眼影消肿增强眼部立体感"], "不对称眼": ["建议通过不对称眼线的技巧进行视觉修正"] }
  },
  "长脸": {
    faceShape: "长脸",
    strengths: ["五官纵向比例舒展", "中庭立体有纵向优势", "适合成熟优雅风格"],
    concerns: ["中庭偏长可通过横向妆容缩短", "额头较高时需通过发型修饰"],
    summaryTemplate: "面部纵向线条优美，五官比例舒展，气质偏向知性优雅。通过横向腮红和卧蚕妆容可在视觉上缩短中庭比例。",
    eyeStrengths: { "杏眼": ["眼型圆润平衡了脸型长度", "适合打造温柔无辜眼妆"], "单眼皮": ["干净的单眼皮配合卧蚕可缩短中庭"], "不对称眼": ["眼部特点可与脸型形成有趣的视觉层次"] },
    eyeConcerns: { "杏眼": [], "单眼皮": ["建议重点突出卧蚕来缩短中庭视觉"], "不对称眼": ["可通过卧蚕平衡中庭比例"] }
  },
  "方脸": {
    faceShape: "方脸",
    strengths: ["下颌线条清晰有气场", "骨骼立体适合高级妆感", "轮廓分明有辨识度"],
    concerns: ["下颌角偏宽，可通过柔雾妆容弱化", "需避免硬朗眉形加重骨骼感"],
    summaryTemplate: "面部骨骼感强，下颌线条清晰有力，气质偏向成熟大气。通过柔和眉形和哑光底妆可弱化下颌线条，突出眉眼优势。",
    eyeStrengths: { "杏眼": ["圆润眼型柔化了面部骨骼感", "与方脸形成刚柔并济的视觉效果"], "单眼皮": ["干练的单眼皮契合方脸的气质", "适合打造气场型妆容"], "不对称眼": ["不对称特点可增加方脸的个人辨识度"] },
    eyeConcerns: { "杏眼": [], "单眼皮": [], "不对称眼": [] }
  },
  "心形脸": {
    faceShape: "心形脸",
    strengths: ["额头饱满有辨识度", "下巴尖俏精致", "苹果肌位置优越"],
    concerns: ["上宽下窄需平衡视觉重心", "需避免上重下轻的妆容"],
    summaryTemplate: "面部上宽下窄，额头饱满下巴尖俏，气质偏向甜美灵动。通过饱满苹果肌和圆润眼线下移视觉重心，可完美平衡脸型比例。",
    eyeStrengths: { "杏眼": ["圆润眼型与心形脸天生契合", "增加甜美可爱的视觉效果"], "单眼皮": ["干净的单眼皮打造透明感妆容", "适合心形脸的元气风格"], "不对称眼": ["可通过圆润眼线调整视觉重心平衡脸型"] },
    eyeConcerns: { "杏眼": [], "单眼皮": [], "不对称眼": ["建议重点修饰眼线和卧蚕来平衡面部比例"] }
  },
  "鹅蛋脸": {
    faceShape: "鹅蛋脸",
    strengths: ["面部比例标准均衡", "几乎适合所有妆容风格", "五宫分布协调"],
    concerns: ["无需修容调整，保持原生质感即可"],
    summaryTemplate: "标准鹅蛋脸，面部比例协调，五官分布均衡，是最百搭的脸型。通过清透底妆突出皮肤原生质感，几乎适配所有妆容风格。",
    eyeStrengths: { "杏眼": ["圆眼睛配合标准脸型是绝佳组合", "可打造多种风格的眼妆"], "单眼皮": ["单眼皮在标准脸型上更显气质", "适合知性通勤风格"], "不对称眼": ["标准脸型能很好地平衡眼型特点"] },
    eyeConcerns: { "杏眼": [], "单眼皮": [], "不对称眼": [] }
  }
};

/**
 * BeautyReportGenerator - Rule-based content generation
 */
class BeautyReportGenerator {
  classifyFaceShape(metrics: BeautyFaceMetricsExtended): FaceShapeResult {
    const { faceWidth, faceHeight, jawWidth, chinLength } = metrics;
    const faceHWRatio = faceHeight > 0 ? faceWidth / faceHeight : 0.75;
    const jawRatio    = faceWidth > 0 ? jawWidth / faceWidth : 0.75;
    const chinRatio   = faceHeight > 0 ? chinLength / faceHeight : 0.32;

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

  inferSkinToneCategory(skinTone: string): "warm" | "cool" | "neutral" | "olive" {
    if (skinTone.includes("暖") || skinTone.includes("黄")) return "warm";
    if (skinTone.includes("冷") || skinTone.includes("白")) return "cool";
    if (skinTone.includes("橄榄")) return "olive";
    return "neutral";
  }

  getFoundationTip(skinTone: string): string {
    if (skinTone.includes("暖") || skinTone.includes("黄")) {
      return "选择带暖调的象牙色或自然色粉底，避免过白的冷色调";
    }
    if (skinTone.includes("冷") || skinTone.includes("白")) {
      return "选择带粉调的瓷白色或玫瑰色粉底，避免偏黄的暖色调";
    }
    if (skinTone.includes("橄榄")) {
      return "选择中性偏绿的橄榄色粉底，避免过粉或过黄的色调";
    }
    return "选择中性色调的自然肤色粉底，根据环境光调整深浅";
  }

  /**
   * TASK-BeautyMini-059: 根据肤色推断四季色彩类型
   */
  inferSeasonColorType(skinTone: string, skinToneCategory: string): string {
    const warmSeasons = ["春季型", "秋季型"];
    const coolSeasons = ["夏季型", "冬季型"];
    const isWarm = skinToneCategory === "warm" || skinTone.includes("暖") || skinTone.includes("黄");
    const isCool = skinToneCategory === "cool" || skinTone.includes("冷") || skinTone.includes("白");
    const isOlive = skinToneCategory === "olive" || skinTone.includes("橄榄");

    if (isOlive) return "秋季型";
    if (isWarm) return Math.random() > 0.5 ? "春季型" : "秋季型";
    if (isCool) return Math.random() > 0.5 ? "夏季型" : "冬季型";
    return "春季型"; // 中性默认春季型
  }

  /**
   * Generate full BeautyReportContent from face metrics and level.
   */
  generate(metrics: BeautyFaceMetrics, level: "first-look" | "style-upgrade" | "beauty-pro"): BeautyReportContent {
    const now = new Date().toISOString();
    const extendedMetrics = metrics as unknown as BeautyFaceMetricsExtended;
    const isExtended = "faceWidth" in extendedMetrics;

    let faceShapeResult: FaceShapeResult;
    if (isExtended) {
      faceShapeResult = this.classifyFaceShape(extendedMetrics);
    } else {
      faceShapeResult = { faceShape: metrics.faceShape, confidence: 0.75 };
    }

    const shape = faceShapeResult.faceShape;
    const faceRule = FACE_SHAPE_RULES[shape] || FACE_SHAPE_RULES["鹅蛋脸"];
    const features = this.buildFeatureHighlights(extendedMetrics, metrics);
    const skinToneCat = this.inferSkinToneCategory(metrics.skinTone);

    const faceAnalysis: FaceAnalysisSection = {
      faceShape: shape,
      faceRatio: metrics.faceRatio,
      symmetryScore: this.calculateEyeSymmetry(metrics),
      description: `${shape}比例${metrics.faceRatio.toFixed(2)}，${faceRule.description}，分析置信度 ${(faceShapeResult.confidence * 100).toFixed(0)}%`,
      highlightPoints: [
        `脸型特征：${shape}，比例协调，置信度 ${(faceShapeResult.confidence * 100).toFixed(0)}%`,
        `眼型特点：${metrics.eyeType}`,
        isExtended ? `面部宽高比：${extendedMetrics.faceWidth.toFixed(1)}:${extendedMetrics.faceHeight.toFixed(1)}` : undefined,
        isExtended ? `下颌宽度比：${((extendedMetrics.jawWidth / extendedMetrics.faceWidth) * 100).toFixed(0)}%` : undefined
      ].filter((v): v is string => v !== undefined)
    };

    const colorRecommendation: ColorRecommendationSection = {
      skinToneCategory: skinToneCat,
      recommendedPalette: faceRule.palette,
      avoidColors: faceRule.avoidColors,
      foundationTip: this.getFoundationTip(metrics.skinTone)
    };

    const makeupStyle: MakeupStyleSuggestion = {
      primaryStyle: faceRule.style,
      secondaryStyles: faceRule.styles.slice(1, 3),
      occasion: this.mapOccasion(level),
      confidence: faceShapeResult.confidence
    };

    const styleDirection: StyleDirection = {
      overallDirection: faceRule.direction,
      keyElements: faceRule.elements,
      avoidPatterns: faceRule.avoidPatterns,
      vibeDescription: faceRule.description
    };

    return {
      faceAnalysis,
      featureHighlights: features,
      makeupStyle,
      colorRecommendation,
      styleDirection,
      productRecommendation: [],
      generatedAt: now,
      version: "v1"
    };
  }

  /**
   * Generate v2 report with enhanced analysis fields.
   * TASK-BeautyMini-059: 根据三档报告体系输出差异化内容
   *   - first-look:   faceInsight (基础分析)
   *   - style-upgrade: + seasonColorAnalysis + styleUpgradeContent
   *   - beauty-pro:   + personalPlan
   */
  generateV2(metrics: BeautyFaceMetrics, level: "first-look" | "style-upgrade" | "beauty-pro"): BeautyReportContentV2 {
    const extendedMetrics = metrics as unknown as BeautyFaceMetricsExtended;
    const isExtended = "faceWidth" in extendedMetrics;

    const faceShapeResult = isExtended
      ? this.classifyFaceShape(extendedMetrics)
      : { faceShape: metrics.faceShape, confidence: 0.75 };

    const shape = faceShapeResult.faceShape;
    const faceRule = FACE_SHAPE_RULES[shape] || FACE_SHAPE_RULES["鹅蛋脸"];
    const skinToneCat = this.inferSkinToneCategory(metrics.skinTone);
    const skinTone = metrics.skinTone;

    // ---- faceInsight (all levels) ----
    const faceInsightRule = FACE_INSIGHT_RULES[shape] || FACE_INSIGHT_RULES["鹅蛋脸"];
    const eyeStrengths = faceInsightRule.eyeStrengths[metrics.eyeType] || [];
    const eyeConcerns  = faceInsightRule.eyeConcerns[metrics.eyeType] || [];
    const faceInsight: FaceInsight = {
      summary: faceInsightRule.summaryTemplate,
      strengths: [...faceInsightRule.strengths, ...eyeStrengths],
      concerns: [...faceInsightRule.concerns, ...eyeConcerns]
    };

    // ---- featureHighlights ----
    const features = this.buildFeatureHighlights(extendedMetrics, metrics);

    // ---- colorAnalysis ----
    const seasonType = this.inferSeasonColorType(skinTone, skinToneCat);
    const seasonRule = Object.values(SEASON_COLOR_RULES).find(r => r.seasonType === seasonType) || SEASON_COLOR_RULES["春季型"];
    const colorAnalysis: ColorAnalysis = {
      skinTone,
      skinToneCategory: skinToneCat,
      recommendedColors: faceRule.palette,
      avoidColors: faceRule.avoidColors,
      foundationTip: this.getFoundationTip(skinTone),
      seasonType: seasonType,
      dailyColors: seasonRule.dailyColors,
      specialColors: seasonRule.specialColors
    };

    // ---- colorRecommendation (keep v1 compat) ----
    const colorRecommendation: ColorRecommendationSection = {
      skinToneCategory: skinToneCat,
      recommendedPalette: faceRule.palette,
      avoidColors: faceRule.avoidColors,
      foundationTip: this.getFoundationTip(skinTone)
    };

    // ---- makeupStyle ----
    const makeupStyle: MakeupStyleSuggestion = {
      primaryStyle: faceRule.style,
      secondaryStyles: faceRule.styles.slice(1, 3),
      occasion: this.mapOccasion(level),
      confidence: faceShapeResult.confidence
    };

    // ---- makeupStyleDetail (enhanced with keyPoints + avoidTips) ----
    const makeupStyleDetail: MakeupStyleDetail = {
      styleName: faceRule.makeupStyleName,
      reason: faceRule.reason,
      suitableOccasion: faceRule.suitableOccasion,
      keyPoints: faceRule.elements,
      avoidTips: faceRule.avoidPatterns
    };

    // ---- styleDirection ----
    const styleDirection: StyleDirection = {
      overallDirection: faceRule.direction,
      keyElements: faceRule.elements,
      avoidPatterns: faceRule.avoidPatterns,
      vibeDescription: faceRule.description
    };

    // ---- faceAnalysis ----
    const faceAnalysis: FaceAnalysisSection = {
      faceShape: shape,
      faceRatio: metrics.faceRatio,
      symmetryScore: this.calculateEyeSymmetry(metrics),
      description: `${shape}比例${metrics.faceRatio.toFixed(2)}，${faceRule.description}，分析置信度 ${(faceShapeResult.confidence * 100).toFixed(0)}%`,
      highlightPoints: [
        `脸型特征：${shape}，比例协调，置信度 ${(faceShapeResult.confidence * 100).toFixed(0)}%`,
        `眼型特点：${metrics.eyeType}`
      ].concat(
        isExtended ? [
          `面部宽高比：${extendedMetrics.faceWidth.toFixed(1)}:${extendedMetrics.faceHeight.toFixed(1)}`,
          `下颌宽度比：${((extendedMetrics.jawWidth / extendedMetrics.faceWidth) * 100).toFixed(0)}%`,
          `眼宽比例：${extendedMetrics.eyeWidth > 0 ? (extendedMetrics.eyeWidth / extendedMetrics.faceWidth * 100).toFixed(0) : "N/A"}%`,
          `鼻翼比例：${extendedMetrics.noseWidth > 0 ? (extendedMetrics.noseWidth / extendedMetrics.faceWidth * 100).toFixed(0) : "N/A"}%`,
          `唇宽比例：${extendedMetrics.lipWidth > 0 ? (extendedMetrics.lipWidth / extendedMetrics.noseWidth * 100).toFixed(0) : "N/A"}%`
        ] : []
      )
    };

    // ---- 三档报告差异化内容 ----
    // style-upgrade+ 增加风格建议和四季色彩
    const seasonColorAnalysis: SeasonColorAnalysis = {
      seasonType: seasonRule.seasonType,
      dailyColors: seasonRule.dailyColors,
      specialColors: seasonRule.specialColors,
      seasonDescription: seasonRule.seasonDescription
    };

    const styleUpgradeContent: StyleUpgradeContent = {
      styleRecommendations: [
        `主打${faceRule.makeupStyleName}风格，核心是${faceRule.direction}`,
        ...faceRule.styles.slice(1, 3).map(s => `备选风格：${s}`)
      ],
      eyeMakeupDirection: `眼妆以${eyeStrengths[0] || "突出眼型特点"}为主，配合${faceRule.elements[2] || "自然眉形"}`,
      contourDirection: `修容方向：${faceRule.direction}`,
      lipColorDirection: `唇色推荐：${faceRule.palette.slice(0, 2).join("、")}`
    };

    // beauty-pro 增加私人化方案
    const personalPlan: PersonalBeautyPlan = {
      actionItems: [
        `重点优化：${faceInsight.concerns[0] || "面部比例"}`,
        `发挥优势：${faceInsight.strengths[0] || "五官协调"}`,
        `色彩选择：遵循${seasonType}四季色彩体系`
      ],
      makeupRoutine: [
        "Step 1: 清透底妆 - 根据肤色选择${skinToneCat === 'warm' ? '暖调' : '冷调'}粉底",
        "Step 2: 修容定调 - 按照脸型轮廓进行纵向/横向修容",
        "Step 3: 眼妆重点 - 突出${metrics.eyeType}特点",
        "Step 4: 唇妆点睛 - 选择${faceRule.palette[0] || '豆沙色'}系唇色"
      ],
      beautyTips: [
        `你的${shape}脸型搭配${seasonType}四季色彩体系效果最佳`,
        `建议重点突出${faceInsight.strengths[0] || "眼部"}优势`,
        `避免${faceRule.avoidPatterns[0] || "厚重底妆"}风格`
      ],
      signatureLook: `${faceRule.makeupStyleName} + ${seasonType}色彩体系 = 你的专属气质风格`
    };

    // 构建最终结果，根据level决定输出字段
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
      faceInsight
    };

    if (level === "beauty-pro") {
      return {
        ...baseResult,
        seasonColorAnalysis,
        styleUpgradeContent,
        personalPlan
      };
    }

    if (level === "style-upgrade") {
      return {
        ...baseResult,
        seasonColorAnalysis,
        styleUpgradeContent
      };
    }

    // first-look: 只输出faceInsight
    return baseResult;
  }

  private calculateEyeSymmetry(metrics: BeautyFaceMetrics): number {
    if (metrics.eyeSize > 0) {
      return Math.min(0.95, 0.7 + (metrics.eyeSize / 100));
    }
    return 0.85;
  }

  private mapOccasion(level: "first-look" | "style-upgrade" | "beauty-pro"): "daily" | "formal" | "evening" | "special" {
    switch (level) {
      case "style-upgrade": return "formal";
      case "beauty-pro": return "special";
      default: return "daily";
    }
  }

  private buildFeatureHighlights(
    metrics: BeautyFaceMetricsExtended,
    base: BeautyFaceMetrics
  ): FeatureHighlight[] {
    const eyeTypeData = EYE_TYPE_RULES[base.eyeType] || EYE_TYPE_RULES["杏眼"];

    return [
      {
        feature: "eyes",
        shape: base.eyeType,
        measurement: metrics.eyeWidth > 0
          ? `眼宽${metrics.eyeWidth.toFixed(1)}，眼型${base.eyeType}，占比${(metrics.eyeWidth / metrics.faceWidth * 100).toFixed(0)}%`
          : `眼距适中，眼型${base.eyeType}`,
        recommendation: eyeTypeData.recommendation
      },
      {
        feature: "nose",
        shape: base.noseRatio < 0.4 ? "精致小鼻" : base.noseRatio < 0.5 ? "标准鼻型" : "挺直鼻梁",
        measurement: metrics.noseWidth > 0
          ? `鼻翼宽${metrics.noseWidth.toFixed(1)}，比例${base.noseRatio.toFixed(2)}`
          : `鼻翼比例${base.noseRatio.toFixed(2)}`,
        recommendation: "保持鼻梁自然立体感"
      },
      {
        feature: "lips",
        shape: base.lipRatio < 0.25 ? "小巧嘴唇" : base.lipRatio < 0.35 ? "标准唇形" : "饱满双唇",
        measurement: metrics.lipWidth > 0
          ? `唇宽${metrics.lipWidth.toFixed(1)}，比例${base.lipRatio.toFixed(2)}`
          : `唇宽比例${base.lipRatio.toFixed(2)}`,
        recommendation: "选择与色系搭配的唇妆产品"
      },
      {
        feature: "brows",
        shape: base.jawType === "宽大颌型" ? "上扬眉" : "自然眉",
        measurement: metrics.jawWidth > 0
          ? `颌型${base.jawType}，下颌宽${metrics.jawWidth.toFixed(1)}`
          : `颌型${base.jawType}`,
        recommendation: "根据脸型选择眉形"
      }
    ];
  }
}

export const beautyReportGenerator = new BeautyReportGenerator();
export default beautyReportGenerator;