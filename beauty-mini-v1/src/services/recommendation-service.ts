import type { UserBeautyReport, Blogger, MatchResult } from "@/recommendation/types";
import { BloggerMatcher } from "@/recommendation/BloggerMatcher";
import { SAMPLE_BLOGGERS } from "@/recommendation/bloggers-database";

/**
 * RecommendationService - Orchestrates KOL matching using BloggerMatcher
 */
class RecommendationService {
  private matcher: BloggerMatcher;

  constructor(weights?: any) {
    this.matcher = new BloggerMatcher(weights);
  }

  /** Generate KOL recommendations based on user beauty report */
  async generateRecommendations(userReport: UserBeautyReport): Promise<MatchResult[]> {
    return await this.matcher.matchBloggers(userReport, SAMPLE_BLOGGERS);
  }

  /** Get top N recommended bloggers with formatted data for display */
  async getTopBloggers(n: number = 5, userReport: UserBeautyReport): Promise<Blogger[]> {
    const results = await this.generateRecommendations(userReport);
    // Map MatchResult to Blogger format (take top N)
    const topBloggerIds = results.slice(0, n).map(r => r.bloggerId);
    return SAMPLE_BLOGGERS.filter(b => topBloggerIds.includes(b.id));
  }

  /** Singleton instance */
  static instance: RecommendationService;
  static getInstance(weights?: any) {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService(weights);
    }
    return RecommendationService.instance;
  }
}
export default RecommendationService;
