import type { RecommendInput, ProductRecommendation } from "./types";
import type { Env } from "../../../functions/types";

// Load products from static dataset file (fallback)
async function loadProductsFromJson(): Promise<Record<string, unknown>[]> {
  try {
    const mod = await import("../../../datasets/products.json");
    return mod.default as Record<string, unknown>[];
  } catch {
    return [];
  }
}

/**
 * Query admin_products from D1 (active products only).
 * Returns empty array when D1 is unavailable or table is empty.
 */
async function loadProductsFromD1(env: Env): Promise<Record<string, unknown>[]> {
  try {
    const result = await env.D1_DB.prepare(
      "SELECT id, name, brand, category, price, original_price, image_url, description, platform, affiliate_link, stock, status, featured, recommended_tags FROM admin_products WHERE status = ? ORDER BY featured DESC, created_at DESC LIMIT 50"
    ).bind("active").all();

    if (result.success && result.results) {
      return result.results.map((row: any) => ({
        id: row.id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        category_cn: row.category,
        price: row.price,
        original_price: row.original_price,
        image_url: row.image_url,
        description: row.description || "",
        platform: row.platform || "",
        affiliate_link: row.affiliate_link || "",
        stock: row.stock || 0,
        status: row.status,
        featured: row.featured || 0,
        reason: row.description || "",
        // Map D1 fields to product-matcher expected fields
        skin_types: [],
        face_shapes: [],
        makeup_styles: [],
        tags: [],
        recommended_tags: row.recommended_tags || "[]",
      }));
    }
    return [];
  } catch (err) {
    console.warn("[product-matcher] D1 query failed, falling back to JSON:", err);
    return [];
  }
}

/**
 * Scoring rules:
 *   - category match:         +40  (exact category relevance)
 *   - skin_type match:        +30  (product fits user skin)
 *   - face_shape match:       +20  (product suits user face type)
 *   - makeup_style overlap:   +10  per overlapping style tag
 *   - reason bonus:           +10  (has editorial reason)
 *
 * Score capped at 100.
 */
function scoreProduct(
  product: Record<string, unknown>,
  input: RecommendInput,
): number {
  let score = 0;

  const categories = product["category"] as string[] | string | undefined;
  if (categories) {
    const catSet = Array.isArray(categories) ? categories : [categories];
    const styleMap: Record<string, string[]> = {
      daily:   ["foundation", "lip", "eye", "blush"],
      natural: ["foundation", "lip", "eye", "blush"],
      fresh:   ["foundation", "lip", "eye", "blush"],
      formal:  ["foundation", "lip", "eye", "blush"],
      evening: ["lip", "eye", "foundation"],
      special: ["lip", "eye", "foundation"],
    };
    const compatible = styleMap[input.makeupStyle] ?? [];
    const overlap = catSet.filter((c: string) => compatible.includes(c)).length;
    if (overlap > 0) score += overlap * 10;
  }

  const skinTypes = product["skin_types"] as string[] | undefined;
  if (skinTypes && (skinTypes.includes("all") || skinTypes.includes(input.skinType))) {
    score += 30;
  }

  const faceShapes = product["face_shapes"] as string[] | undefined;
  if (faceShapes && faceShapes.includes(input.faceType)) {
    score += 20;
  }

  const makeupStyles = product["makeup_styles"] as string[] | undefined;
  if (makeupStyles && makeupStyles.includes(input.makeupStyle)) {
    score += 15;
  }

  const reason = product["reason"] as string | undefined;
  if (reason) score += 10;

  return Math.min(score, 100);
}

/**
 * ProductMatcher – returns scored product recommendations.
 *
 * Data source priority:
 *   1. D1 admin_products (active only)
 *   2. Static datasets/products.json (fallback)
 *
 * Datasets must NOT be deleted — they serve as fallback data.
 */
export class ProductMatcher {
  constructor(private env?: Env) {}

  async match(input: RecommendInput): Promise<ProductRecommendation[]> {
    // D1 first
    let products = this.env
      ? await loadProductsFromD1(this.env)
      : [];

    // JSON fallback if D1 returned nothing
    if (products.length === 0) {
      products = await loadProductsFromJson();
    }

    const scored = products.map((p) => ({
      product: p,
      score: scoreProduct(p, input),
    }));

    const ranked = scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return ranked.map((r) => ({
      id: String(r.product["id"]),
      name: String(r.product["name"]),
      brand: String(r.product["brand"] ?? ""),
      category: String(r.product["category"] ?? ""),
      category_cn: String(r.product["category_cn"] ?? r.product["category"] ?? ""),
      reason: String(r.product["reason"] ?? r.product["description"] ?? ""),
      matchScore: r.score,
    }));
  }
}
