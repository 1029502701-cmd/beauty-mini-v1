import type { Env } from "../../../functions/types";
import { RankingService } from "../../../modules/beauty-ai/recommendation/ranking";
import type { RecommendInput } from "../../../modules/beauty-ai/recommendation/types";

/**
 * GET /api/beauty/recommend
 *
 * Query params:
 *   - faceType    (required)  Oval | Heart | Round | Square | Long | Diamond
 *   - skinType    (required)  Dry | Oily | Normal | Combination | Sensitive
 *   - makeupStyle (required)  daily | natural | fresh | formal | evening | special
 *   - userPreference (optional)  Free-text preference keyword
 */
export async function onRequestGet(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  const faceType = url.searchParams.get("faceType");
  const skinType = url.searchParams.get("skinType");
  const makeupStyle = url.searchParams.get("makeupStyle");
  const userPreference = url.searchParams.get("userPreference") || undefined;

  if (!faceType || !skinType || !makeupStyle) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required params: faceType, skinType, makeupStyle",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const input: RecommendInput = {
    faceType: faceType.toLowerCase(),
    skinType: skinType.toLowerCase(),
    makeupStyle: makeupStyle.toLowerCase(),
    userPreference,
  };

  try {
    const service = new RankingService();
    const result = await service.recommend(input);

    return new Response(
      JSON.stringify({ success: true, products: result.products, creators: result.creators }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[beauty/recommend] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
