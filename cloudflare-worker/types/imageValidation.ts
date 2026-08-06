/**
 * Image validation types for Task-BeautyMini-049-B
 */

export type FaceDetectionErrorCode =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'INVALID_IMAGE'
  | 'AI_SERVICE_UNAVAILABLE';

export interface ImageValidationResult {
  valid: boolean;
  faceCount: number;
  confidence: number;
  code?: FaceDetectionErrorCode;
  message?: string;
}

/**
 * Face detection result with proper typing.
 */
export interface FaceDetectionResult {
  /** Number of faces detected */
  faceCount: number;
  /** Confidence score of the detection (0-1) */
  confidence: number;
  /** Facial landmarks if available */
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    leftMouth: { x: number; y: number };
    rightMouth: { x: number; y: number };
  };
}

/**
 * Face detection provider interface.
 * Implementations: Workers AI, MediaPipe, or custom models.
 */
export interface FaceDetectionProvider {
  /**
   * Detect faces in an image and return validation result.
   * @param imageBuffer - Raw image bytes (jpeg/png/webp)
   * @returns ImageValidationResult
   */
  detectFaces(imageBuffer: ArrayBuffer): Promise<ImageValidationResult>;
}
