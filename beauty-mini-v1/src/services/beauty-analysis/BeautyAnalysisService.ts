import type {
  BeautyAnalysisRequest,
  BeautyAnalysisResult,
  BeautyReport,
  FaceDetectorAdapter,
  AIBeautyProvider
} from "@/types/adapters";
import { REPORT_LEVELS } from "@/types/report-level";
import { RemoteFaceDetector } from "@/types/remote-face-detector";
import { MockFaceDetector } from "@/types/mock-face-detector";

class BeautyAnalysisService {
  private faceDetector: FaceDetectorAdapter;
  private aiProvider: AIBeautyProvider;

  constructor(
    faceDetector?: FaceDetectorAdapter, 
    aiProvider?: AIBeautyProvider
  ) {
    this.faceDetector = faceDetector || new RemoteFaceDetector();
    this.aiProvider = aiProvider || new MockAIBeautyProvider();
  }

  async analyzeBeauty(request) {
    const reportId = "report_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    const levelConfig = REPORT_LEVELS[request.reportLevel];
    const expireDays = levelConfig?.expireDays || 7;
    const expireDate = new Date(now);
    expireDate.setDate(expireDate.getDate() + parseInt(expireDays.toString()));
    
    try {
      const faceRes = await this.faceDetector.detectFaces(request.imageUrl);
      const m = faceRes.metrics;
      
      const eyeSymmetry = m.leftEyeWidth > 0 && m.rightEyeWidth > 0 
        ? parseFloat((1 - Math.abs(m.leftEyeWidth - m.rightEyeWidth) / m.eyeDistance).toFixed(2))
        : 0.85;

      const faceMetrics = {
        faceShape: this.classifyFaceShape(m.faceWidth, m.faceHeight),
        faceWidth: m.faceWidth,
        faceHeight: m.faceHeight,
        faceRatio: m.faceRatio,
        jawWidth: m.jawWidth,
        chinLength: m.chinLength,
        eyeMetrics: {
          eyeSpacing: m.eyeDistance,
          symmetry: eyeSymmetry,
          clarity: parseFloat((0.75 + Math.random() * 0.25).toFixed(2))
        },
        noseMetrics: {
          bridgeHeight: Math.floor(m.noseHeight * (0.8 + Math.random() * 0.4)),
          tipRoundedness: parseFloat((0.5 + Math.random() * 0.4).toFixed(2)),
          alarWidth: m.noseWidth
        },
        lipMetrics: {
          thickness: Math.floor(m.lipWidth * 0.3 + 4),
          fullness: parseFloat((0.5 + Math.random() * 0.4).toFixed(2)),
          symmetry: parseFloat((0.7 + Math.random() * 0.25).toFixed(2))
        }
      };

      const analysis = await this.aiProvider.analyze(request);
      (analysis as any).faceMetrics = faceMetrics;

      const report = {
        reportId,
        userId: request.userId,
        level: request.reportLevel,
        analysisResult: { ...analysis, faceMetrics },
        createdAt: now,
        expireAt: expireDate.toISOString()
      };

      // [debug removed]
      return report;
    } catch (error) {
      console.error("[BeautyAnalysisService] Analysis failed:", error);
      throw new Error("AI分析失败，请重试");
    }
  }

  private classifyFaceShape(w: number, h: number): string {
    const ratio = w / h;
    if (ratio > 0.85) return "圆脸";
    if (ratio < 0.7) return "长脸";
    if (h > w * 1.2) return "鹅蛋脸";
    if (Math.abs(ratio - 0.8) < 0.05) return "心形脸";
    return "方脸";
  }
}

class MockAIBeautyProvider implements AIBeautyProvider {
  readonly name = "mock";
  
  async analyze(request) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const styles = ["清透自然型", "欧美浓妆型", "韩系甜妹型", "成熟御姐型", "日系清新型"];
    const colors = ["奶茶色", "玫瑰色", "裸粉色", "香槟金", "橘棕色", "豆沙色", "珊瑚红"];
    return {
      makeupStyle: styles[Math.floor(Math.random() * styles.length)],
      colorRecommendation: colors.sort(() => Math.random() - 0.5).slice(0, 4),
      beautyScore: parseFloat((70 + Math.random() * 25).toFixed(1)),
      suggestions: [
        "保持日常清洁，使用温和的洁面产品",
        "建议搭配补水保湿类产品进行护理",
        "注意防晒，减少紫外线对皮肤的伤害",
        "定期做面膜护肤以保持皮肤状态"
      ]
    };
  }
  
  async healthCheck() { return { healthy: true, latencyMs: 120 }; }
}

export default BeautyAnalysisService;
