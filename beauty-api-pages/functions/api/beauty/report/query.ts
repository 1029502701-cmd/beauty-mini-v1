import type { Env } from '../../../../types';
import { ReportAccessService } from '../../../../modules/beauty-ai/permission/report-access-service';

export async function onRequestGet(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  const url = new URL(request.url);
  const reportId = url.searchParams.get('id');

  if (!reportId) {
    return new Response(
      JSON.stringify({ success: false, error: "Query param 'id' is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const row = await env.D1_DB.prepare(
      "SELECT id, user_id, image_id, image_url, thumbnail_url, level, status, analysis_json, created_at FROM beauty_reports WHERE id = ? LIMIT 1"
    ).bind(reportId).first();

    if (!row) {
      return new Response(
        JSON.stringify({ success: false, error: 'Report not found' }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let reportJson: unknown;
    try {
      reportJson = JSON.parse(row.analysis_json);
    } catch {
      reportJson = { raw: row.analysis_json };
    }

    const sessionId = request.headers.get('X-Session-Id') || '';
    const userId = sessionId || 'anonymous';

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID required' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
    if (!sessionRaw) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const resolvedUserId = JSON.parse(sessionRaw).userId;

    if (row.user_id !== resolvedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: you can only query your own reports' }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const reportAccessService = new ReportAccessService(env.D1_DB);
    const accessRecord = await reportAccessService.checkReportAccess(resolvedUserId, reportId, row.level as 'first-look' | 'style-upgrade' | 'beauty-pro');

    const level = row.level as 'first-look' | 'style-upgrade' | 'beauty-pro';

    if (!accessRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Report not unlocked for this level',
          reportLevel: level,
          unlocked: false,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          id: row.id,
          userId: row.user_id,
          uploadId: row.image_id,
          imageUrl: row.image_url,
          thumbnailUrl: row.thumbnail_url,
          reportLevel: row.level,
          status: row.status,
          reportJson,
          createdAt: row.created_at,
        },
        access: {
          unlocked: true,
          level,
          tokenCost: accessRecord.tokenCost,
          unlockType: accessRecord.unlockType,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('[beauty/report/query] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
