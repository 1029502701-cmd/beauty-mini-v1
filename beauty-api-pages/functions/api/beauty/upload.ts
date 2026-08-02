import { extractSessionId } from '../../../lib/session';
import type { Env } from '../../types';
import { uploadImage, parseFormData } from '../../../modules/beauty-ai/upload-service';
import type { UploadResult } from '../../../modules/beauty-ai/types';

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

  const formData = await parseFormData(request);
  if (!formData) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const imageFile = formData.get('image') as File | null;
  if (!imageFile) {
    return new Response(
      JSON.stringify({ error: "Field 'image' is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Resolve userId from valid session; reject unauthenticated requests
  const sessionId = extractSessionId(request);
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (!sessionRaw) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const { userId } = JSON.parse(sessionRaw);

  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  try {
    const result: UploadResult = await uploadImage(env, imageBuffer, userId, imageFile.type);

    return new Response(
      JSON.stringify({
        success: true,
        uploadId: result.uploadId,
        imageUrl: result.imageKey,
        imageKey: result.imageKey,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[beauty/upload] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
