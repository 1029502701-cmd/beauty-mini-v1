// ============================================
// EYE_TYPE_RULES
// ============================================

export interface EyeTypeRule {
  recommendation: string;
  techniques: string[];
}

export const EYE_TYPE_RULES: Record<string, EyeTypeRule> = {
  "杏眼":      { recommendation: "突出圆润可爱的眼睛特点", techniques: ["下垂眼线", "卧蚕提亮", "自然卷翘睫毛"] },
  "单眼皮":    { recommendation: "强调眼型线条感", techniques: ["消肿哑光眼影", "内眼线", "夹翘睫毛"] },
  "不对称眼":  { recommendation: "通过妆容平衡双眼", techniques: ["调整眼距", "单边矫正眼影"] },
  "丹凤眼":    { recommendation: "突出眼梢上扬的经典美感", techniques: ["上扬眼线", "大地色眼影", "浓密睫毛"] },
  "桃花眼":    { recommendation: "强调眼部的水灵感和迷离感", techniques: ["粉色系眼影", "下眼睑晕染", "卷翘睫毛"] },
  "下垂眼":    { recommendation: "提升眼梢，打造上扬精神感", techniques: ["上挑眼线", "眼影向上晕染", "浓密纤长睫毛"] },
  "内双":      { recommendation: "放大双眼轮廓，突出双眼皮线条", techniques: ["双眼皮贴", "珠光眼影", "浓密睫毛"] },
  "肿眼泡":    { recommendation: "消肿哑光，塑造眼部立体感", techniques: ["哑光大地色", "眼窝晕染", "内眼线"] },
};

export function inferSkinToneCategory(skinTone: string): "warm" | "cool" | "neutral" | "olive" {
  if (skinTone.includes("暖") || skinTone.includes("黄")) return "warm";
  if (skinTone.includes("冷") || skinTone.includes("白")) return "cool";
  if (skinTone.includes("橄榄")) return "olive";
  return "neutral";
}

export function getFoundationTip(skinTone: string): string {
  if (skinTone.includes("暖") || skinTone.includes("黄")) {
    return "选择带暖调的象牙色或自然色粉底，避免过白的冷色调";
  }
  if (skinTone.includes("冷") || skinTone.includes("白")) {
    return "选择带粉调的瓷白色或玫瑰色粉底，避免偏黄的暖色调";
  }
  if (skinTone.includes("橄榄")) {
    return "选择中性偏绿的橄榄色粉底，避免过粉或过黄的色调";
  }
  return "选择中性色调的自然肤色粉底，根据环境光调整深浅";
}

export function inferSeasonColorType(skinTone: string, skinToneCategory: string): string {
  const isWarm  = skinToneCategory === "warm" || skinTone.includes("暖") || skinTone.includes("黄");
  const isCool  = skinToneCategory === "cool" || skinTone.includes("冷") || skinTone.includes("白");
  const isOlive = skinToneCategory === "olive" || skinTone.includes("橄榄");

  if (isOlive) return "秋季型";
  if (isWarm)  return Math.random() > 0.5 ? "春季型" : "秋季型";
  if (isCool)  return Math.random() > 0.5 ? "夏季型" : "冬季型";
  return "春季型";
}