import type { Env } from '../../types';
import { extractSessionId } from '../../../lib/session';
import { FaceAnalysisEngine } from '../../../modules/beauty-ai/face-analysis';
import type { FaceMetrics } from '../../../modules/beauty-ai/face-types';

interface AnalyzeRequest {
  uploadId?: string;
  imageKey?: string;
}

/**
 * POST /api/beauty/analyze
 *
 * Accepts { uploadId, imageKey }, runs face analysis, and returns metrics.
 */
export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Request body must be valid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!body.imageKey) {
    return new Response(
      JSON.stringify({ error: "Field 'imageKey' is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

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
        body.imageKey = decodeURIComponent(body.imageKey);
    console.log("analyze userId:", userId);
    console.log("analyze imageKey:", body.imageKey);

  if (!body.imageKey.startsWith('beauty/uploads/' + userId + '/')) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: image does not belong to you' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!env.IMAGE_BUCKET) {
    return new Response(
      JSON.stringify({ error: 'IMAGE_BUCKET R2 binding is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const engine = new FaceAnalysisEngine();
  const object = await env.IMAGE_BUCKET.get(body.imageKey);

  if (!object) {
    return new Response(
      JSON.stringify({ error: 'Image not found in storage' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const imageBuffer = Buffer.from(await object.arrayBuffer());
    const metrics: FaceMetrics = await engine.analyze(imageBuffer);

    return new Response(
      JSON.stringify({
        success: true,
        uploadId: body.uploadId ?? null,
        imageKey: body.imageKey,
        metrics,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[beauty/analyze] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
