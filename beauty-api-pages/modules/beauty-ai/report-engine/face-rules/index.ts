// ============================================
// FACE_SHAPE_RULES & FACE_INSIGHT_RULES
// Migrated from cloudflare-worker/lib/reportGenerator.ts (TASK-Beauty-V8-Migrate-004)
// ============================================
import type { FaceInsight } from "../../types";

export const FACE_SHAPE_TARGETS: Record<string, { fhr: number; jr: number; cr: number }> = {
  "鹅蛋脸": { fhr: 0.67, jr: 0.72, cr: 0.30 },
  "圆脸":   { fhr: 0.90, jr: 0.88, cr: 0.25 },
  "方脸":   { fhr: 0.80, jr: 0.92, cr: 0.30 },
  "心形脸": { fhr: 0.75, jr: 0.60, cr: 0.22 },
  "长脸":   { fhr: 0.55, jr: 0.68, cr: 0.40 },
};

export interface FaceShapeRule {
  style: string;
  styles: string[];
  palette: string[];
  avoidColors: string[];
  direction: string;
  elements: string[];
  avoidPatterns: string[];
  description: string;
  makeupStyleName: string;
  reason: string;
  suitableOccasion: string;
}

export const FACE_SHAPE_RULES: Record<string, FaceShapeRule> = {
  "圆脸": {
    style: "显瘦立体型",
    styles: ["立体修容妆", "清透自然型", "韩系水光肌"],
    palette: ["奶茶色", "大地色", "玫瑰棕", "豆沙色"],
    avoidColors: ["荧光粉", "亮橙色"],
    direction: "通过修容拉长脸部轮廓，突出五官立体感",
    elements: ["修容高光盘", "竖形眼线", "自然眉峰"],
    avoidPatterns: ["横向腮红", "平眉", "大volume眼影"],
    description: "适合侧光和纵向线条妆容，避免横向拉宽脸部",
    makeupStyleName: "立体修容妆",
    reason: "圆脸轮廓柔和，通过纵向修容和立体阴影拉长脸型，突出五官立体感",
    suitableOccasion: "日常通勤、约会、宴会"
  },
  "长脸": {
    style: "柔和缩短型",
    styles: ["韩系甜美型", "日系清新型", "温柔无辜眼妆"],
    palette: ["蜜桃粉", "珊瑚橘", "浅杏色", "浅棕色"],
    avoidColors: ["深棕色", "烟熏黑"],
    direction: "通过横向扩宽视觉，缩短中庭比例",
    elements: ["横向腮红", "卧蚕", "弧度眉形"],
    avoidPatterns: ["高额头露发", "长直眉", "深色眼影"],
    description: "适合增加面部宽度感的妆容，避免纵向拉长",
    makeupStyleName: "韩系甜美妆",
    reason: "长脸中庭偏长，通过横向腮红和卧蚕缩短视觉比例，增加甜美柔和感",
    suitableOccasion: "日常通勤、休闲、约会"
  },
  "方脸": {
    style: "柔美调和型",
    styles: ["成熟御姐型", "港风复古型", "柔雾哑光妆"],
    palette: ["砖红色", "酒红色", "琥珀色", "暖驼色"],
    avoidColors: ["冷紫色", "荧光色"],
    direction: "柔化下颌线条，突出眉眼优势",
    elements: ["柔和眉形", "珠光高光", "饱满唇妆"],
    avoidPatterns: ["直角眉峰", "方正下颌线强调", "哑光底妆"],
    description: "适合柔和曲线和暖调色彩，弱化骨骼感",
    makeupStyleName: "柔雾哑光妆",
    reason: "方脸骨骼感强，通过柔和眉形和哑光底妆弱化下颌线条，突出眉眼优势",
    suitableOccasion: "正式场合、晚宴、商务"
  },
  "心形脸": {
    style: "甜美平衡型",
    styles: ["韩系水光肌", "日系透明感", "元气少女妆"],
    palette: ["蜜桃粉", "珊瑚红", "香槟金", "裸粉色"],
    avoidColors: ["深酒红", "姨妈色"],
    direction: "平衡上宽下窄，突出苹果肌",
    elements: ["饱满苹果肌", "圆润眼线", "嘟嘟唇效"],
    avoidPatterns: ["浓重眉峰", "V型修容", "上重下轻妆容"],
    description: "适合饱满柔和的元气妆容，突出甜美气质",
    makeupStyleName: "元气少女妆",
    reason: "心形脸上宽下窄，通过饱满苹果肌和圆润眼线下移视觉重心，平衡脸型",
    suitableOccasion: "日常、约会、聚会"
  },
  "鹅蛋脸": {
    style: "清透自然型",
    styles: ["清透自然型", "知性通勤妆", "日杂透明感"],
    palette: ["奶茶色", "玫瑰粉", "香槟金", "珊瑚橘"],
    avoidColors: [],
    direction: "标准脸型适配多种风格，突出皮肤质感",
    elements: ["清透底妆", "自然眉眼", "滋润唇部"],
    avoidPatterns: ["厚重假面感", "夸张轮廓"],
    description: "标准脸型，几乎适合所有妆容风格",
    makeupStyleName: "清透自然妆",
    reason: "鹅蛋脸比例标准，突出皮肤原生质感即可，无需过多修容调整",
    suitableOccasion: "日常通勤、休闲、约会"
  }
};

export interface FaceInsightRule {
  faceShape: string;
  strengths: string[];
  concerns: string[];
  summaryTemplate: string;
  eyeStrengths: Record<string, string[]>;
  eyeConcerns: Record<string, string[]>;
}

export const FACE_INSIGHT_RULES: Record<string, FaceInsightRule> = {
  "圆脸": {
    faceShape: "圆脸",
    strengths: ["脸颊饱满有少女感", "轮廓柔和显年轻", "笑容时苹果肌饱满"],
    concerns: ["面部轮廓偏短，可通过修容拉长", "下颌线条不明显"],
    summaryTemplate: "面部轮廓柔和饱满，苹果肌发育良好，整体气质偏向甜美可爱。面部比例均衡，通过纵向修容可进一步优化脸型。",
    eyeStrengths: { "杏眼": ["眼睛圆润可爱，天然增加亲和力"], "单眼皮": ["眼型线条干净，适合打造清透妆效"], "不对称眼": ["眼部基础条件良好，可通过眼线微调平衡"] },
    eyeConcerns: { "杏眼": [], "单眼皮": ["可通过眼影消肿增强眼部立体感"], "不对称眼": ["建议通过不对称眼线的技巧进行视觉修正"] }
  },
  "长脸": {
    faceShape: "长脸",
    strengths: ["五官纵向比例舒展", "中庭立体有纵向优势", "适合成熟优雅风格"],
    concerns: ["中庭偏长可通过横向妆容缩短", "额头较高时需通过发型修饰"],
    summaryTemplate: "面部纵向线条优美，五官比例舒展，气质偏向知性优雅。通过横向腮红和卧蚕妆容可在视觉上缩短中庭比例。",
    eyeStrengths: { "杏眼": ["眼型圆润平衡了脸型长度", "适合打造温柔无辜眼妆"], "单眼皮": ["干净的单眼皮配合卧蚕可缩短中庭"], "不对称眼": ["眼部特点可与脸型形成有趣的视觉层次"] },
    eyeConcerns: { "杏眼": [], "单眼皮": ["建议重点突出卧蚕来缩短中庭视觉"], "不对称眼": ["可通过卧蚕平衡中庭比例"] }
  },
  "方脸": {
    faceShape: "方脸",
    strengths: ["下颌线条清晰有气场", "骨骼立体适合高级妆感", "轮廓分明有辨识度"],
    concerns: ["下颌角偏宽，可通过柔雾妆容弱化", "需避免硬朗眉形加重骨骼感"],
    summaryTemplate: "面部骨骼感强，下颌线条清晰有力，气质偏向成熟大气。通过柔和眉形和哑光底妆可弱化下颌线条，突出眉眼优势。",
    eyeStrengths: { "杏眼": ["圆润眼型柔化了面部骨骼感", "与方脸形成刚柔并济的视觉效果"], "单眼皮": ["干练的单眼皮契合方脸的气质", "适合打造气场型妆容"], "不对称眼": ["不对称特点可增加方脸的个人辨识度"] },
    eyeConcerns: { "杏眼": [], "单眼皮": [], "不对称眼": [] }
  },
  "心形脸": {
    faceShape: "心形脸",
    strengths: ["额头饱满有辨识度", "下巴尖俏精致", "苹果肌位置优越"],
    concerns: ["上宽下窄需平衡视觉重心", "需避免上重下轻的妆容"],
    summaryTemplate: "面部上宽下窄，额头饱满下巴尖俏，气质偏向甜美灵动。通过饱满苹果肌和圆润眼线下移视觉重心，可完美平衡脸型比例。",
    eyeStrengths: { "杏眼": ["圆润眼型与心形脸天生契合", "增加甜美可爱的视觉效果"], "单眼皮": ["干净的单眼皮打造透明感妆容", "适合心形脸的元气风格"], "不对称眼": ["可通过圆润眼线调整视觉重心平衡脸型"] },
    eyeConcerns: { "杏眼": [], "单眼皮": [], "不对称眼": ["建议重点修饰眼线和卧蚕来平衡面部比例"] }
  },
  "鹅蛋脸": {
    faceShape: "鹅蛋脸",
    strengths: ["面部比例标准均衡", "几乎适合所有妆容风格", "五宫分布协调"],
    concerns: ["无需修容调整，保持原生质感即可"],
    summaryTemplate: "标准鹅蛋脸，面部比例协调，五官分布均衡，是最百搭的脸型。通过清透底妆突出皮肤原生质感，几乎适配所有妆容风格。",
    eyeStrengths: { "杏眼": ["圆眼睛配合标准脸型是绝佳组合", "可打造多种风格的眼妆"], "单眼皮": ["单眼皮在标准脸型上更显气质", "适合知性通勤风格"], "不对称眼": ["标准脸型能很好地平衡眼型特点"] },
    eyeConcerns: { "杏眼": [], "单眼皮": [], "不对称眼": [] }
  }
};

/**
 * Build FaceInsight from shape + eyeType rules.
 */
export function buildFaceInsight(shape: string, eyeType: string): FaceInsight {
  const rule = FACE_INSIGHT_RULES[shape] || FACE_INSIGHT_RULES["鹅蛋脸"];
  const eyeStrengths = rule.eyeStrengths[eyeType] || [];
  const eyeConcerns  = rule.eyeConcerns[eyeType] || [];
  return {
    summary: rule.summaryTemplate,
    strengths: [...rule.strengths, ...eyeStrengths],
    concerns: [...rule.concerns, ...eyeConcerns]
  };
}
