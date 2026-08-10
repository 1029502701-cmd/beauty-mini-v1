/**
 * Beauty Recommendation Service
 * Calls GET /api/beauty/recommend with faceType, skinType, makeupStyle.
 */

import { request } from "@/services/api";

export interface Recommendation {
  success: boolean;
  products?: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    price?: number;
    reason: string;
  }>;
  creators?: Array<{
    id: string;
    name: string;
    avatar?: string;
    platform?: string;
    description: string;
    styleTags: string[];
  }>;
  error?: string;
}

class RecommendService {
  /**
   * GET /api/beauty/recommend?faceType=&skinType=&makeupStyle=
   */
  async getRecommendations(params: {
    faceType: string;
    skinType: string;
    makeupStyle: string;
    userPreference?: string;
  }): Promise<Recommendation> {
    const { faceType, skinType, makeupStyle, userPreference } = params;
    const query = new URLSearchParams({ faceType, skinType, makeupStyle });
    if (userPreference) query.set("userPreference", userPreference);

    try {
      const response = await request<{ products: any[]; creators: any[] }>(
        "/api/beauty/recommend?" + query.toString(),
        "GET"
      );
      if (response.success && response.data) {
        return {
          success: true,
          products: response.data.products || [],
          creators: response.data.creators || []
        };
      }
      return { success: false, error: response.error || "推荐查询失败" };
    } catch (err) {
      console.error("[RecommendService] error:", err);
      return { success: false, error: "推荐查询失败" };
    }
  }
}

export const recommendService = new RecommendService();
export default recommendService;
