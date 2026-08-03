import type { BeautyAnalysisRequest, BeautyAnalysisResult } from "./beauty-analysis";

export interface FaceDetectorAdapter {
  detectFaces(imageUrl: string): Promise<{
    faceCount: number;
    metrics: {
      // Basic landmark coordinates
      width: number;
      height: number;
      leftEyeX: number;
      rightEyeX: number;
      topNoseY: number;
      bottomLipY: number;
      // Derived face metrics
      faceWidth: number;
      faceHeight: number;
      faceRatio: number;
      jawWidth: number;
      chinLength: number;
      eyeDistance: number;
      leftEyeWidth: number;
      rightEyeWidth: number;
      noseWidth: number;
      noseHeight: number;
      lipWidth: number;
    };
  }>;
}

export interface AIBeautyProvider {
  name: string;
  analyze(request: BeautyAnalysisRequest): Promise<BeautyAnalysisResult>;
  healthCheck(): Promise<{ healthy: boolean; latencyMs?: number }>;
}

export class MockAIBeautyProvider implements AIBeautyProvider {
  readonly name = "mock";
  
  async analyze(request) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const styles = ["清透自然型", "欧美浓妆型", "韩系甜妹型", "成熟御姐型", "日系清新型"];
    const colors = ["奶茶色", "玫瑰色", "裸粉色", "香槟金", "橘棕色", "豆沙色", "珊瑚红"];
    return {
      faceMetrics: {
        faceShape: ["圆脸", "方脸", "鹅蛋脸", "心形脸", "长脸"][Math.floor(Math.random() * 5)],
        faceWidth: Math.floor(160 + Math.random() * 60),
        faceHeight: Math.floor(200 + Math.random() * 50),
        eyeMetrics: {
          eyeSpacing: Math.floor(50 + Math.random() * 30),
          symmetry: 0.85 + Math.random() * 0.15,
          clarity: 0.8 + Math.random() * 0.2
        },
        noseMetrics: {
          bridgeHeight: Math.floor(50 + Math.random() * 50),
          tipRoundedness: 0.6 + Math.random() * 0.4,
          alarWidth: Math.floor(25 + Math.random() * 20)
        },
        lipMetrics: {
          thickness: Math.floor(4 + Math.random() * 6),
          fullness: 0.6 + Math.random() * 0.4,
          symmetry: 0.8 + Math.random() * 0.2
        }
      },
      analysis: {
        makeupStyle: styles[Math.floor(Math.random() * styles.length)],
        colorRecommendation: colors.sort(() => Math.random() - 0.5).slice(0, 4),
        beautyScore: parseFloat((70 + Math.random() * 25).toFixed(1)),
        suggestions: [
          "保持日常清洁，使用温和的洁面产品",
          "建议搭配补水保湿类产品进行护理",
          "注意防晒，减少紫外线对皮肤的伤害",
          "定期做面膜护肤以保持皮肤状态"
        ]
      }
    };
  }
  
  async healthCheck() { return { healthy: true, latencyMs: 120 }; }
}

export class MockFaceDetector implements FaceDetectorAdapter {
  async detectFaces(imageUrl) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const w = Math.floor(180 + Math.random() * 40);
    const h = Math.floor(220 + Math.random() * 40);
    return {
      faceCount: 1,
      metrics: {
        width: w,
        height: h,
        leftEyeX: w * 0.3 + Math.random() * 10,
        rightEyeX: w * 0.7 - Math.random() * 10,
        topNoseY: h * 0.4 + Math.random() * 15,
        bottomLipY: h * 0.6 + Math.random() * 10,
        faceWidth: w,
        faceHeight: h,
        faceRatio: w / h,
        jawWidth: w * 0.85,
        chinLength: h * 0.2,
        eyeDistance: w * 0.4,
        leftEyeWidth: w * 0.08,
        rightEyeWidth: w * 0.08,
        noseWidth: w * 0.15,
        noseHeight: h * 0.1,
        lipWidth: w * 0.2,
      }
    };
  }
}