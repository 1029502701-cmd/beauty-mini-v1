import { BeautyReport, Product, MatchReason, FaceShape, MakeupStyle, SkinType } from "./types";

const WEIGHTS = {
  makeupStyle: 0.30,
  skinType: 0.25,
  colorMatch: 0.20,
  faceShape: 0.15,
  usageContext: 0.10
};

export class MatchingScore {
  static calculateMakeupStyleMatch(report: MakeupStyle, targetStyle: MakeupStyle): number {
    if (report === targetStyle) return 100;
    const compatible = this.getStyleCompatibility(report, targetStyle);
    return compatible ? 80 : 40;
  }

  static calculateSkinTypeMatch(report: SkinType, productTypes: SkinType[]): number {
    if (productTypes.includes(report)) return 100;
    if (report === "敏感性" && (productTypes.includes("干性") || productTypes.includes("油性"))) {
      return 90;
    }
    return productTypes.length > 0 ? 60 : 0;
  }

  static calculateColorMatch(reportColors: string[], productColors: string[]): number {
    if (reportColors.length === 0 || productColors.length === 0) return 50;
    const common = reportColors.filter(c => productColors.includes(c)).length;
    return common > 0 ? Math.min(100, common * 33) : 20;
  }

  static calculateFaceShapeMatch(report: FaceShape, supports: FaceShape[]): number {
    return supports.includes(report) ? 100 : 70;
  }

  static calculateUsageMatch(reportContext?: string, productCategory?: ProductCategory): number {
    if (!reportContext || !productCategory) return 50;
    const contextMap = {
      "日常": ["粉底", "腮红"],
      "约会": ["口红", "眼影"],
      "工作": ["粉底", "遮瑕"],
      "派对": ["口红", "高光"]
    };
    return contextMap[reportContext]?.includes(productCategory) ? 100 : 60;
  }

  private static getStyleCompatibility(report: MakeupStyle, target: MakeupStyle): boolean {
    const compatibilities = {
      "日常": ["日常", "日系", "韩系"],
      "浓妆": ["浓妆", "欧美风", "复古"],
      "欧美风": ["欧美风", "浓妆", "复古"],
      "日系": ["日常", "日系", "韩系"],
      "韩系": ["日常", "日系", "韩系"],
      "复古": ["浓妆", "欧美风", "复古"]
    };
    return compatibilities[report]?.includes(target) || false;
  }

  public static calculateAll(report: BeautyReport, product: Product): { score: number; reasons: any[] } {
    const reasons: any[] = [];
    const styleScore = this.calculateMakeupStyleMatch(report.makeupStyle, product.styles[0]);
    reasons.push({ criterion: "妆容风格匹配", score: styleScore, details: report.makeupStyle + " vs " + product.styles.join("、"), weight: WEIGHTS.makeupStyle });
    const skinScore = this.calculateSkinTypeMatch(report.skinType, product.skinTypes);
    reasons.push({ criterion: "肤质匹配", score: skinScore, details: report.skinType + " 皮肤，适合：" + product.skinTypes.join("、"), weight: WEIGHTS.skinType });
    const colorScore = this.calculateColorMatch(report.recommendedColors, product.colors);
    reasons.push({ criterion: "颜色匹配", score: colorScore, details: "推荐色 " + report.recommendedColors.join("、") + " vs 产品色 " + product.colors.join("、"), weight: WEIGHTS.colorMatch });
    const faceScore = this.calculateFaceShapeMatch(report.faceShape, product.faceShapeSupports);
    reasons.push({ criterion: "脸型适配", score: faceScore, details: report.faceShape + " 脸型支持：" + product.faceShapeSupports.join("、"), weight: WEIGHTS.faceShape });
    const usageScore = this.calculateUsageMatch(report.usageContext, product.category);
    reasons.push({ criterion: "使用场景", score: usageScore, details: "场景 " + (report.usageContext ?? "未指定") + " vs 类别 " + product.category, weight: WEIGHTS.usageContext });
    const weightedScore = reasons.reduce((total, r) => total + r.score * r.weight, 0);
    const finalScore = Math.round(weightedScore * 100) / 100;
    return { score: finalScore, reasons };
  }
}
