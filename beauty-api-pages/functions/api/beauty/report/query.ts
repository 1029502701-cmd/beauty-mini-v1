import type { Env } from '../../../types';

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
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Step 1: Get report from D1
    const row = await env.D1_DB.prepare(
      "SELECT id, user_id, image_id, level, status, analysis_json, created_at FROM beauty_reports WHERE id = ? LIMIT 1"
    ).first<{ id: string; user_id: string; image_id: string; level: string; status: string; analysis_json: string; created_at: string }>(reportId);

    if (!row) {
      return new Response(
        JSON.stringify({ success: false, error: 'Report not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let reportJson: unknown;
    try {
      reportJson = JSON.parse(row.analysis_json);
    } catch {
      reportJson = { raw: row.analysis_json };
    }

    // Step 2: Check permission (simplified inline)
    const TOKEN_COST: Record<string, number> = { 'first-look': 0, 'style-upgrade': 0, 'beauty-pro': 3 };

    // Get session from X-Session-Id header
    const sessionId = request.headers.get('X-Session-Id') || '';
    const userId = sessionId || 'anonymous';

    // Validate session and resolve real userId
    const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
    if (!sessionRaw) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const resolvedUserId = JSON.parse(sessionRaw).userId;

    // Get token balance — use resolvedUserId (not sessionId)
    const balanceRow = await env.D1_DB.prepare(
      "SELECT balance FROM user_tokens WHERE user_id = ? LIMIT 1"
    ).first<{ balance: number }>(resolvedUserId);
    const balance = balanceRow ? balanceRow.balance : 0;

    // Report owner validation: current session user can only query their own reports
    if (row.user_id !== resolvedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: you can only query your own reports' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permission
    const cost = TOKEN_COST[row.level] ?? 0;
    if (cost > balance) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Insufficient tokens. ' + row.level + ' requires ' + cost + ' token(s), balance: ' + balance,
          tokenRequired: cost,
          balance,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          id: row.id,
          userId: row.user_id,
          uploadId: row.image_id,
          reportLevel: row.level,
          status: row.status,
          reportJson,
          createdAt: row.created_at,
        },
        balance,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[beauty/report/query] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}