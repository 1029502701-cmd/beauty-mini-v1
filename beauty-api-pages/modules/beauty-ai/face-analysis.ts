import type { FaceDetector, FaceMetrics } from './face-types';
import type { BeautyFaceMetrics } from './types/beauty';

/**
 * Default detector that returns deterministic placeholder metrics.
 */
class PlaceholderDetector implements FaceDetector {
  async detect(_image: Uint8Array): Promise<FaceMetrics> {
    return {
      faceWidth: 128,
      faceHeight: 160,
      faceRatio: 0.8,
      eyeDistance: 32,
      eyeWidthLeft: 24,
      eyeWidthRight: 24,
      noseWidth: 18,
      lipWidth: 30,
      faceType: '鹅蛋脸',
    };
  }
}

export class FaceAnalysisEngine {
  private detector: FaceDetector;

  constructor(detector?: FaceDetector) {
    this.detector = detector ?? new PlaceholderDetector();
  }

  async analyze(image: Uint8Array): Promise<FaceMetrics> {
    return this.detector.detect(image);
  }

  /**
   * Analyze and return full BeautyFaceMetrics with all required fields.
   * Uses faceType from FaceMetrics and fills in defaults for missing fields.
   */
  async analyzeBeauty(image: Uint8Array): Promise<BeautyFaceMetrics> {
    const metrics = await this.analyze(image);
    return {
      faceShape: metrics.faceType || '鹅蛋脸',
      faceRatio: metrics.faceRatio,
      eyeType: '杏眼',
      eyeSize: 0,
      noseRatio: 0.4,
      lipRatio: 0.3,
      jawType: '标准颌型',
      skinTone: '中性',
    };
  }
}
