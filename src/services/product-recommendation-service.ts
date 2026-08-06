import { ProductMatcher } from "./recommendation/product";
import type { BeautyReport, ProductMatchResult } from "./recommendation/product/types";

class ProductRecommendationService {
  private matcher: ProductMatcher;

  constructor() {
    this.matcher = new ProductMatcher();
  }

  /**
   * 生成产品推荐列表
   * @param report 用户美妆特征报告
   * @param count 返回的推荐数量（默认全部）
   * @returns 排序后的推荐结果
   */
  async generateRecommendations(report: BeautyReport, count?: number): Promise<ProductMatchResult[]> {
    const results = await this.matcher.match(report);
    return count ? results.slice(0, count) : results;
  }
}

export default ProductRecommendationService;