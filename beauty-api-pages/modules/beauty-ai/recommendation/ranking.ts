import type {
  RecommendInput,
  RecommendResult,
  ProductRecommendation,
  CreatorRecommendation,
} from "./types";
import { ProductMatcher } from "./product-matcher";
import { CreatorMatcher } from "./creator-matcher";

/**
 * RankingService – orchestrates product and creator recommendations.
 *
 * Combines results from ProductMatcher and CreatorMatcher,
 * applies optional post-filtering, and returns a unified RecommendResult.
 */
export class RankingService {
  private productMatcher: ProductMatcher;
  private creatorMatcher: CreatorMatcher;

  constructor() {
    this.productMatcher = new ProductMatcher();
    this.creatorMatcher = new CreatorMatcher();
  }

  /**
   * Run full recommendation pipeline.
   *
   * @param input  Face type, skin type, makeup style, optional user preference
   * @returns      Sorted products and creators
   */
  async recommend(input: RecommendInput): Promise<RecommendResult> {
    const [products, creators] = await Promise.all([
      this.productMatcher.match(input),
      this.creatorMatcher.match(input),
    ]);

    return {
      products: this.rankProducts(products),
      creators: this.rankCreators(creators),
    };
  }

  /**
   * Post-rank products: high score first, limit to 8.
   */
  private rankProducts(products: ProductRecommendation[]): ProductRecommendation[] {
    return products
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);
  }

  /**
   * Post-rank creators: high score first, limit to 6.
   */
  private rankCreators(creators: CreatorRecommendation[]): CreatorRecommendation[] {
    return creators
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }
}
