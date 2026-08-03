import type { Env } from '../../functions/types';
import type { UploadResult } from './types';

/**
 * Uploads an image buffer to R2 under beauty/uploads/{userId}/{timestamp}.jpg
 */
export async function uploadImage(
  env: Env,
  imageBuffer: Buffer | Uint8Array,
  userId: string,
  contentType: string = 'image/jpeg',
): Promise<UploadResult> {
  const timestamp = Date.now();
  const imageKey = `beauty/uploads/${userId}/${timestamp}.jpg`;

  if (!env.IMAGE_BUCKET) {
    throw new Error('IMAGE_BUCKET R2 binding is not configured');
  }

  await env.IMAGE_BUCKET.put(imageKey, imageBuffer, {
    httpMetadata: {
      contentType,
    },
  });

  const uploadId = `upload_${timestamp}_${userId.slice(-6)}`;

  return { uploadId, imageKey };
}

/**
 * Returns parsed formData if request is multipart, otherwise null.
 */
export function parseFormData(request: Request): Promise<FormData | null> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return Promise.resolve(null);
  }
  return request.formData();
}
