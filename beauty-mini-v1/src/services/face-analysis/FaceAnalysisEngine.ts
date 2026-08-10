import type { BeautyFaceMetrics } from "@/types/beauty";
import { type FaceDetectorAdapter } from "@/types/adapters";
import { MediaPipeFaceDetector } from "@/types/mediapipe-face-detector";
import { RemoteFaceDetector } from "@/types/remote-face-detector";

/**
 * FaceAnalysisEngine - Unified face analysis abstraction layer.
 */
class FaceAnalysisEngine {
  private readonly remoteDetector: RemoteFaceDetector;
  private readonly mediaPipeDetector: MediaPipeFaceDetector;
  private activeDetector: FaceDetectorAdapter;

  constructor() {
    this.remoteDetector = new RemoteFaceDetector();
    this.mediaPipeDetector = new MediaPipeFaceDetector();
    // Prefer MediaPipe by default, fall back to Remote if needed
    this.activeDetector = this.mediaPipeDetector;
  }

  setDetector(detector: FaceDetectorAdapter): void {
    this.activeDetector = detector;
  }

  async analyze(imageUrl: string): Promise<BeautyFaceMetrics> {
    try {
      const detectorResult = await this.activeDetector.detectFaces(imageUrl);
      return this.transformToBeautyFaceMetrics(detectorResult.metrics);
    } catch (error) {
      console.warn("[FaceAnalysisEngine] Active detector failed:", error);
      if (this.activeDetector instanceof MediaPipeFaceDetector) {
        // [debug removed]
        this.activeDetector = this.remoteDetector;
        try {
          const detectorResult = await this.remoteDetector.detectFaces(imageUrl);
          return this.transformToBeautyFaceMetrics(detectorResult.metrics);
        } catch (fallbackError) {
          console.error("[FaceAnalysisEngine] Remote fallback also failed:", fallbackError);
        }
      }
      throw new Error("Face analysis failed, please try again");
    }
  }

  private transformToBeautyFaceMetrics(metrics: any): BeautyFaceMetrics {
    const faceRatio = Number((metrics.faceRatio || 0.85).toFixed(2));
    let faceShape = "鹅蛋脸";
    if (faceRatio > 0.85) faceShape = "圆脸";
    else if (faceRatio < 0.7) faceShape = "长脸";
    else {
      if (metrics.jawWidth && metrics.jawWidth > metrics.faceWidth * 0.85) faceShape = "方脸";
      else if (metrics.chinLength && metrics.chinLength > metrics.faceHeight * 0.25) faceShape = "心形脸";
      else faceShape = "鹅蛋脸";
    }
    let eyeType = "杏眼";
    if (metrics.leftEyeWidth && metrics.rightEyeWidth) {
      const widthDiff = Math.abs(metrics.leftEyeWidth - metrics.rightEyeWidth);
      if (widthDiff > 15) eyeType = "不对称眼";
      else if (metrics.leftEyeWidth < 25 && metrics.rightEyeWidth < 25) eyeType = "单眼皮";
      else eyeType = "杏眼";
    }
    const noseWidth = metrics.noseWidth || 0;
    const lipWidth = metrics.lipWidth || 0;
    const faceWidth = metrics.faceWidth || 1;
    const noseRatio = Number((noseWidth / faceWidth).toFixed(3));
    const lipRatio = Number((lipWidth / faceWidth).toFixed(3));
    let jawType = "标准颌型";
    if (metrics.jawWidth && metrics.jawWidth > faceWidth * 0.9) {
      jawType = "宽大颌型";
    } else if (metrics.jawWidth && metrics.jawWidth < faceWidth * 0.75) {
      jawType = "窄小颌型";
    }
    const skinTone = "中性";
    return {
      faceShape,
      faceRatio,
      eyeType,
      eyeSize: metrics.eyeDistance || 0,
      noseRatio,
      lipRatio,
      jawType,
      skinTone,
    };
  }
}

const faceAnalysisEngine = new FaceAnalysisEngine();
export default faceAnalysisEngine;
export { FaceAnalysisEngine, type BeautyFaceMetrics };