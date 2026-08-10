import type { BeautyReport, CreatorRecommendation, ProductRecommendation } from "@/types/beauty";
import { BloggerMatcher, type UserAestheticProfile } from "./BloggerMatcher";
import { SAMPLE_BLOGGERS } from "./bloggers-database";
import creatorsData from "../datasets/creators.json";

const MAKEUP_STYLE_MAP: Record<string, string> = {
  natural: "清透自然型",
  daily: "清透自然型",
  glam: "欧美浓妆型",
  heavy: "欧美浓妆型",
  sweet: "韩系甜妹型",
  korean: "韩系甜妹型",
  mature: "成熟御姐型",
  japanese: "日系清新型",
  fresh: "日系清新型"
};

const FACE_SHAPE_MAP: Record<string, string> = {
  oval: "鹅蛋脸",
  round: "圆脸",
  long: "长脸",
  square: "方脸",
  heart: "心形脸",
  鹅蛋脸: "鹅蛋脸",
  圆脸: "圆脸",
  长脸: "长脸",
  方脸: "方脸",
  心形脸: "心形脸"
};

const SKIN_TONE_MAP: Record<string, string> = {
  warm: "暖皮",
  cool: "冷皮",
  neutral: "中性皮",
  olive: "中性皮",
  暖皮: "暖皮",
  冷皮: "冷皮",
  中性皮: "中性皮"
};

const COLOR_MAP: Record<string, string> = {
  奶茶色: "奶茶色",
  豆沙色: "豆沙色",
  裸粉色: "裸粉色",
  香槟金: "香槟金",
  橘棕色: "橘棕色",
  玫瑰色: "玫瑰色",
  珊瑚红: "珊瑚红",
  nude: "奶茶色",
  pink: "裸粉色",
  rose: "玫瑰色",
  orange: "橘棕色",
  coral: "珊瑚红",
  champagne: "香槟金"
};

interface RawProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  colors: string[];
  skinTypes: string[];
  styles: string[];
  faceShapeSupports: string[];
  price: number;
  purchaseUrl: string;
  description: string;
}

const SAMPLE_PRODUCTS: RawProduct[] = [
  { id: "p001", name: "无瑕持妆粉底液 SPF30", brand: "Lumina Beauty", category: "粉底", colors: ["象牙白", "自然色", "小麦色"], skinTypes: ["干性", "混合性", "中性"], styles: ["日常", "韩系"], faceShapeSupports: ["圆脸", "鹅蛋脸", "心形脸"], price: 299, purchaseUrl: "#", description: "轻薄持妆，自然遮瑕" },
  { id: "p002", name: "丝绒哑光口红 #18", brand: "VelvetGlow", category: "口红", colors: ["豆沙红", "正红", "砖红"], skinTypes: ["油性", "混合性", "中性"], styles: ["浓妆", "欧美风", "日常"], faceShapeSupports: ["所有脸型"], price: 189, purchaseUrl: "#", description: "丝绒哑光质地，持久显色" },
  { id: "p003", name: "大地色系眼影盘", brand: "EyeMasters", category: "眼影", colors: ["棕褐色", "深咖", "米色", "香槟金"], skinTypes: ["所有肤质"], styles: ["日常", "欧美风", "复古"], faceShapeSupports: ["方脸", "长脸", "鹅蛋脸"], price: 249, purchaseUrl: "#", description: "日常通勤到晚宴全能盘" },
  { id: "p004", name: "水润保湿遮瑕膏", brand: "CoverPerfect", category: "遮瑕", colors: ["肤色", "象牙白", "自然色"], skinTypes: ["干性", "敏感性"], styles: ["日常", "日系"], faceShapeSupports: ["圆脸", "心形脸", "鹅蛋脸"], price: 169, purchaseUrl: "#", description: "水润保湿，不卡纹" },
  { id: "p005", name: "高光提亮修容饼", brand: "ShinePro", category: "高光", colors: ["香槟金", "珍珠白", "玫瑰金"], skinTypes: ["油性", "混合性"], styles: ["派对", "浓妆"], faceShapeSupports: ["长脸", "方脸", "鹅蛋脸"], price: 219, purchaseUrl: "#", description: "自然提亮，立体修容" },
  { id: "p006", name: "粉嫩腮红 #05", brand: "CheekPop", category: "腮红", colors: ["浅粉", "珊瑚粉", "蜜桃色"], skinTypes: ["干性", "中性"], styles: ["日常", "日系", "韩系"], faceShapeSupports: ["圆脸", "心形脸", "鹅蛋脸"], price: 149, purchaseUrl: "#", description: "清透粉嫩，元气腮红" },
  { id: "p007", name: "防水眼线液笔", brand: "LineMaster", category: "眼线", colors: ["黑色", "深棕色"], skinTypes: ["所有肤质"], styles: ["浓妆", "欧美风", "复古"], faceShapeSupports: ["所有脸型"], price: 129, purchaseUrl: "#", description: "持久防水，精细勾勒" },
  { id: "p008", name: "清透定妆喷雾", brand: "FixGlow", category: "定妆", colors: [], skinTypes: ["油性", "混合性", "中性"], styles: ["日常", "派对"], faceShapeSupports: ["所有脸型"], price: 99, purchaseUrl: "#", description: "长效定妆，清爽不黏腻" }
];

const CATEGORY_TO_BEAUTY: Record<string, "brow" | "eye" | "lip" | "skincare"> = {
  "粉底": "skincare",
  "口红": "lip",
  "眼影": "eye",
  "遮瑕": "skincare",
  "高光": "eye",
  "腮红": "cheek",
  "眼线": "eye",
  "定妆": "skincare"
};

const PRODUCT_SCENE_MAP: Record<string, string> = {
  "粉底": "日常适用",
  "口红": "全场景",
  "眼影": "通勤/约会",
  "遮瑕": "日常适用",
  "高光": "派对/晚宴",
  "腮红": "日常/约会",
  "眼线": "全场景",
  "定妆": "全天持妆"
};

function mapChineseFaceShape(shape?: string): string {
  return FACE_SHAPE_MAP[shape || ""] || "鹅蛋脸";
}

function generateCreatorRecommendations(report: BeautyReport): Promise<CreatorRecommendation[]> {
  const bloggerMatcher = new BloggerMatcher();

  const faceShape = mapChineseFaceShape(report.profile.faceShape) || "鹅蛋脸";
  const makeupStyle = MAKEUP_STYLE_MAP[report.analysis.makeupStyle] || "清透自然型";
  const skinTone = SKIN_TONE_MAP[report.analysis.skinType] || "中性皮";
  const colorRec = (report.colors.recommendedColors || []).map(c => COLOR_MAP[c] || c);
  const safeColors = colorRec.length > 0 ? colorRec : ["奶茶色", "裸粉色"];

  const userReport = {
    faceShape,
    eyeShape: "杏眼",
    lipShape: "饱满唇",
    makeupStyle,
    colorRecommendation: safeColors as string[],
    skinTone,
    faceMetrics: {
      faceWidth: 150, faceHeight: 190, faceRatio: 0.79,
      jawWidth: 155, chinLength: 38, eyeDistance: 65, noseWidth: 30, lipWidth: 45
    }
  };

  return bloggerMatcher.matchBloggers(userReport as never, SAMPLE_BLOGGERS as never)
    .then((matchResults) => {
      // 只推荐 Top 2 达人
      return matchResults.slice(0, 2).map((mr) => {
        const blogger = SAMPLE_BLOGGERS.find(b => b.id === mr.bloggerId);
        if (!blogger) return null;

        const suitableStyle = blogger.styleTags[0] || "";
        const score = Math.round(mr.score);
        const reasons = mr.matchReasons.slice(0, 2);

        return {
          id: blogger.id,
          name: blogger.name,
          avatar: blogger.avatar,
          platform: blogger.platform,
          description: blogger.description,
          styleTags: blogger.styleTags,
          matchScore: score,
          matchReasons: reasons.length > 0 ? reasons : ["风格与您的分析结果匹配"],
          suitableStyle
        };
      }).filter(Boolean) as CreatorRecommendation[];
    });
}

export function generateProductRecommendations(report: BeautyReport, count: number = 4): ProductRecommendation[] {
  const results = SAMPLE_PRODUCTS.map(p => ({
    product: p,
    ...calculateProductScore(report, p)
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return results.map(({ product, score, reasons }) => {
    const priority: "high" | "medium" | "low" = score >= 80 ? "high" : score >= 60 ? "medium" : "low";
    return {
      id: product.id,
      category: (CATEGORY_TO_BEAUTY[product.category] || "skincare") as "brow" | "eye" | "lip" | "skincare",
      productType: product.category,
      name: product.name,
      brand: product.brand,
      reason: reasons.join("；"),
      priority,
      priorityScene: PRODUCT_SCENE_MAP[product.category] || "日常适用",
      recommendedTags: reasons.slice(0, 3)
    };
  });
}

function calculateProductScore(report: BeautyReport, product: RawProduct): { score: number; reasons: string[] } {
  const makeupStyle = MAKEUP_STYLE_MAP[report.analysis.makeupStyle] || "日常";
  const faceShape = mapChineseFaceShape(report.profile.faceShape) || "鹅蛋脸";
  const skinType = report.analysis.skinType || "中性";
  const colors: string[] = report.colors.recommendedColors || [];

  const styleScore = product.styles.includes(makeupStyle) ? 100 :
    (product.styles.some(s => makeupStyle.includes(s) || s.includes(makeupStyle)) ? 80 : 40);

  const skinScore = product.skinTypes.includes(skinType) ? 100 : 60;

  const colorScore = colors.length === 0 ? 50 :
    (colors.some(c => product.colors.some(pc => pc.includes(c) || c.includes(pc))) ? 80 : 30);

  const faceScore = product.faceShapeSupports.includes("所有脸型") || product.faceShapeSupports.includes(faceShape) ? 100 : 70;

  const usageScore = 60;

  const weightedScore =
    styleScore * 0.30 +
    skinScore * 0.20 +
    colorScore * 0.20 +
    faceScore * 0.20 +
    usageScore * 0.10;

  const reasons: string[] = [];
  if (styleScore >= 80) reasons.push(`适配${makeupStyle}妆容风格`);
  if (skinScore >= 80) reasons.push(`${skinType}肌适用`);
  if (faceScore >= 80) reasons.push(`适合${faceShape}脸型`);
  if (colorScore >= 60) reasons.push("推荐色系匹配");
  if (reasons.length === 0) reasons.push("综合适配度高");

  return { score: Math.round(weightedScore), reasons };
}

export async function generateAllRecommendations(
  report: BeautyReport
): Promise<{ creators: CreatorRecommendation[]; products: ProductRecommendation[] }> {
  const creators = await generateCreatorRecommendations(report);
  const products = generateProductRecommendations(report);
  return { creators, products };
}