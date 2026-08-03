/**
 * Facial measurements extracted from an uploaded image.
 */
export interface FaceMetrics {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;
  eyeDistance: number;
  eyeWidthLeft: number;
  eyeWidthRight: number;
  noseWidth: number;
  lipWidth: number;
  faceType: string;
}

/**
 * Plugin interface for face-detection models.
 * Implementations may use MediaPipe, GPT Vision, Cloud Vision, etc.
 */
export interface FaceDetector {
  detect(image: Uint8Array): Promise<FaceMetrics>;
}
