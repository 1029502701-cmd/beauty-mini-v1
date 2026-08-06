import { Product, BeautyReport, ProductMatchResult, MatchReason, MatchDetails } from "./types";
import { MatchingScore } from "./MatchingScore";
import { SAMPLE_PRODUCTS } from "./products-database";

export class ProductMatcher {
  async match(report: BeautyReport, products: Product[] = SAMPLE_PRODUCTS): Promise<ProductMatchResult[]> {
    const results: ProductMatchResult[] = [];

    for (const product of products) {
      const { score, reasons } = MatchingScore.calculateAll(report, product);
      const matchDetails = this.generateMatchDetails(score, reasons, product, report);

      results.push({
        productId: product.id,
        product,
        score,
        matchReasons: reasons,
        matchDetails
      });
    }

    return results.sort((a, b) => b.score - a.score);
  },

  private generateMatchDetails(
    score: number,
    reasons: MatchReason[],
    product: Product,
    report: BeautyReport
  ): MatchDetails {
    const compatibilityLevel = Math.round(score / 100 * 5);

    let matchQuality: string;
    if (score >= 90) matchQuality = "完美匹配";
    else if (score >= 75) matchQuality = "高度匹配";
    else if (score >= 60) matchQuality = "良好匹配";
    else if (score >= 40) matchQuality = "部分匹配";
    else matchQuality = "不推荐";

    const注意事项: string[] = [];

    if (report.skinType === "敏感性") {
      注意事项.push("敏感肌肤建议先做局部测试");
    }

    return {
      matchQuality,
      compatibilityLevel,
      注意事项: 注意事项.length > 0 ? 注意事项 : undefined
    };
  }
}
