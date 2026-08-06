import type { FaceDetectionProvider, ImageValidationResult } from '../../types/imageValidation';
import { createFaceDetectionProvider } from '../../services/faceDetection/FaceDetectionProvider';
import type { Ai } from '@cloudflare/workers-types';

/**
 * Creates a FaceDetectionProvider based on environment.
 * Wraps factory for dependency injection compatibility.
 */
export function createProvider(env: { AI?: Ai }): FaceDetectionProvider {
  return createFaceDetectionProvider(env);
}

/**
 * Handle /api/validate-image request.
 * Reads image from R2, runs face detection, returns validation result.
 */
export async function handleValidateImage(
  request: Request,
  imageBucket: R2Bucket,
  provider: FaceDetectionProvider,
): Promise<Response> {
  const url = new URL(request.url);
  const uploadId = url.searchParams.get('uploadId');

  if (!uploadId) {
    return new Response(
      JSON.stringify({ valid: false, faceCount: 0, code: 'INVALID_IMAGE', message: 'Missing uploadId parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const object = await imageBucket.get(uploadId);
  if (!object) {
    return new Response(
      JSON.stringify({ valid: false, faceCount: 0, code: 'INVALID_IMAGE', message: 'Image not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const imageBuffer = await object.arrayBuffer();
  const result: ImageValidationResult = await provider.detectFaces(imageBuffer);
  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
