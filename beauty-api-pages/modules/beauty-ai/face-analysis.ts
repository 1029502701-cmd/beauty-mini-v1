import type { FaceDetector, FaceMetrics } from './face-types';

/**
 * Default detector that returns deterministic placeholder metrics.
 * Swap by injecting a real FaceDetector into FaceAnalysisEngine.
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
      faceType: 'oval',
    };
  }
}

/**
 * Beauty face-analysis engine.
 * Accepts an image buffer and returns FaceMetrics.
 * Decouples from any specific AI service via the FaceDetector plugin.
 */
export class FaceAnalysisEngine {
  private detector: FaceDetector;

  constructor(detector?: FaceDetector) {
    this.detector = detector ?? new PlaceholderDetector();
  }

  /**
   * Analyze facial metrics from an image buffer.
   */
  async analyze(image: Uint8Array): Promise<FaceMetrics> {
    return this.detector.detect(image);
  }
}
