import { extractSessionId } from '../../../lib/session';
import type { Env } from '../../types';
import { uploadImage, parseFormData } from '../../../modules/beauty-ai/upload-service';
import type { UploadResult } from '../../../modules/beauty-ai/types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function jsonResponse(data: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/beauty/upload
 *
 * Accepts multipart/form-data with an 'image' field,
 * uploads to R2 (IMAGE_BUCKET), and returns upload metadata.
 */
export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  console.log("[beauty/upload] request headers:", Object.fromEntries(request.headers.entries()));

  const formData = await parseFormData(request);
  if (!formData) {
    return jsonResponse({ success: false, error: 'Content-Type must be multipart/form-data' }, 400);
  }

  const imageFile = formData.get('image') as File | null;
  if (!imageFile) {
    return jsonResponse({ success: false, error: "Field 'image' is required" }, 400);
  }

  // Resolve userId from valid session; reject unauthenticated requests
  const sessionId = extractSessionId(request);
  console.log('[beauty/upload] sessionId from header:', sessionId, 'length:', sessionId.length);
  if (!sessionId) {
    return jsonResponse({ success: false, error: 'Authentication required' }, 401);
  }
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  console.log('[beauty/upload] KV lookup:', sessionRaw ? 'found(' + sessionRaw.length + ')' : 'null');
  if (!sessionRaw) {
    return jsonResponse({ success: false, error: 'Invalid session' }, 401);
  }
  const { userId } = JSON.parse(sessionRaw);

  // Validate MIME type - only allow jpeg/png/webp
  if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
    return jsonResponse(
      { success: false, error: 'Invalid image type. Only jpeg/png/webp are allowed' },
      400,
    );
  }

  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await imageFile.arrayBuffer();
  } catch (err) {
    console.error('[beauty/upload] Error reading file:', err);
    return jsonResponse({ success: false, error: 'Failed to read image file' }, 500);
  }
  const buffer = Buffer.from(imageBuffer);

  try {
    const result: UploadResult = await uploadImage(env, buffer, userId, imageFile.type);

    return jsonResponse({
      success: true,
      uploadId: result.uploadId,
      imageUrl: result.imageKey,
      imageKey: result.imageKey,
    }, 200);
  } catch (err) {
    console.error('[beauty/upload] Error:', err);
    return jsonResponse({ success: false, error: 'Upload failed' }, 500);
  }
}
