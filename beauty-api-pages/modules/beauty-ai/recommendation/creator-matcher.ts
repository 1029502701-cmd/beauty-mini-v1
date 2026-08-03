import type { RecommendInput, CreatorRecommendation } from "./types";
import type { Env } from "../../../functions/types";

// Load creators from static dataset file (fallback)
async function loadCreatorsFromJson(): Promise<Record<string, unknown>[]> {
  try {
    const mod = await import("../../../datasets/creators.json");
    return mod.default as Record<string, unknown>[];
  } catch {
    return [];
  }
}

/**
 * Query beauty_creators from D1 (active creators only).
 * Returns empty array when D1 is unavailable or table is empty.
 */
async function loadCreatorsFromD1(env: Env): Promise<Record<string, unknown>[]> {
  try {
    const result = await env.D1_DB.prepare(
      "SELECT id, name, avatar, platform, description, style_tags, status FROM beauty_creators WHERE status = ? ORDER BY created_at DESC LIMIT 20"
    ).bind("approved").all();

    if (result.success && result.results) {
      return result.results.map((row: any) => ({
        id: row.id,
        creatorName: row.name,
        avatar: row.avatar,
        platform: row.platform,
        description: row.description || "",
        style: row.style_tags || "",
        faceTarget: [],
        makeupStyles: [],
        skinTones: [],
        tags: [],
        style_tag: row.style_tags,
      }));
    }
    return [];
  } catch (err) {
    console.warn("[creator-matcher] D1 query failed, falling back to JSON:", err);
    return [];
  }
}

/**
 * Scoring rules:
 *   - face_target match:      +30  (creator style suits user face type)
 *   - makeup_style overlap:   +25  per overlapping style tag
 *   - skin_tone match:        +20  (creator accommodates user skin tone)
 *   - tag overlap:            +5   per matching tag (up to 3)
 *   - user_preference bonus:  +10  if creator style matches user preference keyword
 *
 * Score capped at 100.
 */
function scoreCreator(
  creator: Record<string, unknown>,
  input: RecommendInput,
): number {
  let score = 0;

  const faceTarget = creator["faceTarget"] as string[] | undefined;
  if (faceTarget && faceTarget.includes(input.faceType)) {
    score += 30;
  }

  const makeupStyles = creator["makeupStyles"] as string[] | undefined;
  if (makeupStyles && makeupStyles.includes(input.makeupStyle)) {
    score += 25;
  }

  const skinTones = creator["skinTones"] as string[] | undefined;
  if (
    skinTones &&
    (skinTones.includes("all") ||
      skinTones.includes(input.skinType) ||
      skinTones.includes("fair") ||
      skinTones.includes("medium"))
  ) {
    score += 20;
  }

  const tags = creator["tags"] as string[] | undefined;
  if (tags) {
    const prefTagCount = tags.filter((t: string) =>
      input.userPreference ? t.includes(input.userPreference) : false,
    ).length;
    score += Math.min(prefTagCount * 5, 15);
  }

  const style = String(creator["style"] ?? creator["style_tag"] ?? "");
  if (input.userPreference && style.includes(input.userPreference)) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * CreatorMatcher – returns scored creator recommendations for style reference.
 *
 * Data source priority:
 *   1. D1 beauty_creators (approved only)
 *   2. Static datasets/creators.json (fallback)
 *
 * Creators are presented as style inspiration only, not for commercial purposes.
 */
export class CreatorMatcher {
  constructor(private env?: Env) {}

  async match(input: RecommendInput): Promise<CreatorRecommendation[]> {
    // D1 first
    let creators = this.env
      ? await loadCreatorsFromD1(this.env)
      : [];

    // JSON fallback if D1 returned nothing
    if (creators.length === 0) {
      creators = await loadCreatorsFromJson();
    }

    const scored = creators.map((c) => ({
      creator: c,
      score: scoreCreator(c, input),
    }));

    const ranked = scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return ranked.map((r) => ({
      id: String(r.creator["id"]),
      creatorName: String(r.creator["creatorName"] || r.creator["name"] || ""),
      style: String(r.creator["style"] || r.creator["style_tag"] || ""),
      description: String(r.creator["description"] ?? ""),
      reason: `风格「${String(r.creator["style"] || r.creator["style_tag"] || "")}」适合${input.faceType}脸型，适配${input.makeupStyle}妆容`,
      matchScore: r.score,
    }));
  }
}
