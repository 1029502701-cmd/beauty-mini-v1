import type { FaceDetectionResult, FaceDetectionProvider, ImageValidationResult } from '../../types/imageValidation';
import type { Ai } from '@cloudflare/workers-types';

/**
 * Raw face detection result interface.
 */
export interface RawFaceDetectionResult {
  faceCount: number;
  confidence: number;
  landmarks?: unknown;
}

/**
 * Interface for raw face detection providers (return FaceDetectionResult).
 */
export interface RawFaceDetectionProvider {
  detectFaces(imageBuffer: ArrayBuffer): Promise<RawFaceDetectionResult>;
}

/**
 * Error thrown when AI binding is not configured.
 */
export const AI_SERVICE_UNAVAILABLE_ERROR =
  'Face detection is not configured. ' +
  'Please add an AI binding to wrangler.toml and configure a face detection model.';

/**
 * Real Workers AI face detection provider.
 * Uses @cf/mediapipe/face-detection model.
 */
export class WorkersAiFaceDetectionProvider implements RawFaceDetectionProvider {
  constructor(private readonly ai: Ai) {}

  async detectFaces(imageBuffer: ArrayBuffer): Promise<RawFaceDetectionResult> {
    const uint8Array = new Uint8Array(imageBuffer);
    const response = (await this.ai.run(
      '@cf/mediapipe/face-detection',
      { image: Array.from(uint8Array) }
    )) as unknown as { results: Array<{ score: number; box: { x: number; y: number; w: number; h: number } }> };

    const detections = response.results ?? [];
    const faceCount = detections.length;
    const confidence = faceCount > 0
      ? Math.max(...detections.map(d => d.score))
      : 0;

    return { faceCount, confidence };
  }
}

/**
 * Adapter that throws when Workers AI is not configured.
 * Does NOT simulate success - returns a clear error.
 */
export class NullFaceDetectionProvider implements RawFaceDetectionProvider {
  async detectFaces(_imageBuffer: ArrayBuffer): Promise<RawFaceDetectionResult> {
    throw new Error(AI_SERVICE_UNAVAILABLE_ERROR);
  }
}

/**
 * Converts raw face detection result to ImageValidationResult with business rules.
 */
export class FaceDetectionValidationAdapter implements FaceDetectionProvider {
  constructor(private readonly rawProvider: RawFaceDetectionProvider) {}

  async detectFaces(imageBuffer: ArrayBuffer): Promise<ImageValidationResult> {
    try {
      const result = await this.rawProvider.detectFaces(imageBuffer);
      return this.toValidationResult(result);
    } catch (error) {
      const isServiceUnavailable = error instanceof Error && error.message === AI_SERVICE_UNAVAILABLE_ERROR;
      return {
        valid: false,
        faceCount: 0,
        confidence: 0,
        code: isServiceUnavailable ? 'AI_SERVICE_UNAVAILABLE' : 'INVALID_IMAGE',
        message: 'Face detection failed: ' + (error instanceof Error ? error.message : String(error)),
      };
    }
  }

  private toValidationResult(detection: RawFaceDetectionResult): ImageValidationResult {
    const { faceCount, confidence } = detection;
    if (faceCount === 0) {
      return {
        valid: false,
        faceCount: 0,
        confidence: 0,
        code: 'NO_FACE',
        message: 'No face detected in image. Please upload a portrait photo.',
      };
    }
    if (faceCount > 1) {
      return {
        valid: false,
        faceCount,
        confidence,
        code: 'MULTIPLE_FACES',
        message: 'Multiple faces detected. Please upload a photo with a single face.',
      };
    }
    return {
      valid: true,
      faceCount: 1,
      confidence,
    };
  }
}

/**
 * Factory function to create the appropriate provider based on environment.
 */
export function createRawFaceDetectionProvider(env: { AI?: Ai }): RawFaceDetectionProvider {
  if (env.AI) {
    return new WorkersAiFaceDetectionProvider(env.AI);
  }
  return new NullFaceDetectionProvider();
}

/**
 * Factory function to create a FaceDetectionProvider (with validation rules) based on environment.
 */
export function createFaceDetectionProvider(env: { AI?: Ai }): FaceDetectionProvider {
  const rawProvider = createRawFaceDetectionProvider(env);
  return new FaceDetectionValidationAdapter(rawProvider);
}