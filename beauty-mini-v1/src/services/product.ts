import type { BeautyProduct } from "@/types";
import { api } from "@/services/api-client";

export class ProductService {
  async getRecommendedProducts(reportId: string): Promise<BeautyProduct[]> {
    try {
      const response = await api.get(`/api/products?reportId=${reportId}`);
      if (response.success) {
        return response.data.products || [];
      } else {
        console.warn(`Products API request failed for report ${reportId}, using fallback`);
        return this.getMockProducts(reportId);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      console.info("Using mock products data");
      return this.getMockProducts(reportId);
    }
  }

  private getMockProducts(reportId: string): BeautyProduct[] {
    return [
      {
        id: "prod-001",
        name: "雾感眉笔",
        brand: "自然妆造",
        image: "https://example.com/brow-pencil.jpg",
        category: "brow",
        price: 59.00,
        reason: "精准勾勒自然眉形，防水防汗，适合清透自然妆容",
        purchaseUrl: "https://example.com/purchase/prod-001",
      },
      {
        id: "prod-002",
        name: "橘调眼影盘",
        brand: "光采色系",
        image: "https://example.com/eyeshadow.jpg",
        category: "eye",
        price: 129.00,
        reason: "温柔提亮眼部，打造清透日常妆效，搭配橘调更显气质",
        purchaseUrl: "https://example.com/purchase/prod-002",
      },
      {
        id: "prod-003",
        name: "豆沙色唇釉",
        brand: "温柔色系",
        image: "https://example.com/lip-gloss.jpg",
        category: "lip",
        price: 89.00,
        reason: "滋润显白，日常百搭不挑皮，打造自然唇妆",
        purchaseUrl: "https://example.com/purchase/prod-003",
      },
      {
        id: "prod-004",
        name: "补水保湿精华",
        brand: "水润肌源",
        image: "https://example.com/serum.jpg",
        category: "skincare",
        price: 168.00,
        reason: "深层补水保湿，维持肌肤水油平衡，打造清透底妆基础",
        purchaseUrl: "https://example.com/purchase/prod-004",
      },
      {
        id: "prod-005",
        name: "温和洁面乳",
        brand: "净颜工坊",
        image: "https://example.com/cleanser.jpg",
        category: "skincare",
        price: 68.00,
        reason: "温和清洁不紧绷，适合混合性皮肤日常使用",
        purchaseUrl: "https://example.com/purchase/prod-005",
      },
    ];
  }
}

export const productService = new ProductService();
