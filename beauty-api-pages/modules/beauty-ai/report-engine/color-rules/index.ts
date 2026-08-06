// ============================================
// SEASON_COLOR_RULES
// ============================================
import type { SeasonColorAnalysis } from "../../types";

export interface SeasonColorRule {
  seasonType: string;
  dailyColors: string[];
  specialColors: string[];
  seasonDescription: string;
  skinToneKeywords: string[];
}

export const SEASON_COLOR_RULES: Record<string, SeasonColorRule> = {
  "春季型": {
    seasonType: "spring",
    dailyColors: ["珊瑚橘", "蜜桃粉", "奶油黄", "浅金橙"],
    specialColors: ["玫瑰金", "橙红色", "暖金色"],
    seasonDescription: "暖调明亮的春季色彩，适合暖黄皮，带来元气活力感",
    skinToneKeywords: ["暖", "黄"]
  },
  "夏季型": {
    seasonType: "summer",
    dailyColors: ["薰衣草紫", "柔粉色", "冰蓝色", "玫瑰粉"],
    specialColors: ["梅子色", "薰衣草紫红", "冰玫瑰"],
    seasonDescription: "柔和冷调的夏季色彩，适合冷白皮，带来清新温柔气质",
    skinToneKeywords: ["冷", "白"]
  },
  "秋季型": {
    seasonType: "autumn",
    dailyColors: ["焦糖棕", "砖红", "橄榄绿", "驼色"],
    specialColors: ["酒红", "金铜色", "深琥珀"],
    seasonDescription: "温暖浓郁的秋季色彩，适合中性及橄榄皮，带来复古优雅感",
    skinToneKeywords: ["橄榄", "中性"]
  },
  "冬季型": {
    seasonType: "winter",
    dailyColors: ["正红色", "宝蓝色", "纯白色", "黑色"],
    specialColors: ["祖母绿", "深紫红", "金属银"],
    seasonDescription: "对比鲜明的冬季色彩，适合冷调肤色，带来高级冷艳感",
    skinToneKeywords: ["冷", "白", "橄榄"]
  }
};

export function getSeasonColorAnalysis(seasonType: string): SeasonColorAnalysis {
  const rule = Object.values(SEASON_COLOR_RULES).find(r => r.seasonType === seasonType) || SEASON_COLOR_RULES["春季型"];
  return {
    seasonType: rule.seasonType,
    dailyColors: rule.dailyColors,
    specialColors: rule.specialColors,
    seasonDescription: rule.seasonDescription
  };
}
