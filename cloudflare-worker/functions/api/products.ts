export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  reason: string;
}

export interface ProductsResponse {
  products: Product[];
}

// Mock product data based on reportId
const getMockProducts = (reportId: string): Product[] => {
  // Simple rule-based matching: map makeup style to product tags
  const products: Product[] = [
    {
      id: "prod-001",
      name: "雾感眉笔",
      brand: "自然妆造",
      category: "brow",
      reason: "精准勾勒自然眉形，防水防汗，适合日常通勤妆容"
    },
    {
      id: "prod-002",
      name: "橘调眼影盘",
      brand: "光采色系",
      category: "eye",
      reason: "温柔提亮眼部，打造清透自然妆效"
    },
    {
      id: "prod-003",
      name: "豆沙色唇釉",
      brand: "温柔色系",
      category: "lip",
      reason: "滋润显白，日常百搭不挑皮"
    },
    {
      id: "prod-004",
      name: "补水保湿精华",
      brand: "水润肌源",
      category: "skincare",
      reason: "深层补水保湿，维持肌肤水油平衡"
    },
    {
      id: "prod-005",
      name: "温和洁面乳",
      brand: "净颜工坊",
      category: "skincare",
      reason: "温和清洁不紧绷，适合混合性皮肤"
    },
  ];

  return products;
};

export async function fetch(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);

  // GET /api/products?reportId=xxx
  if (url.pathname === "/api/products" && request.method === "GET") {
    try {
      const reportId = url.searchParams.get("reportId") || "default-report";
      const products = getMockProducts(reportId);

      const response: ProductsResponse = {
        products: products,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      return new Response(JSON.stringify({
        status: "error",
        message: (err as Error).message || "获取商品失败",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain" },
  });
}
