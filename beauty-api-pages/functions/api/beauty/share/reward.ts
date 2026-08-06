import type { Env } from '../../../../types';
import { ReportAccessService } from '../../../../modules/beauty-ai/permission/report-access-service';
import { extractSessionId } from '../../../../lib/session';

const REWARD_TYPE = "share_style_upgrade";
const DAILY_LIMIT = 1;

export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  try {
    const sessionId = extractSessionId(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, status: "AUTH_REQUIRED", error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionRaw = await env.USER_CACHE.get("session:" + sessionId);
    if (!sessionRaw) {
      return new Response(
        JSON.stringify({ success: false, status: "SESSION_EXPIRED", error: "Invalid or expired session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = JSON.parse(sessionRaw).userId;
    const reportAccessService = new ReportAccessService(env.D1_DB);

    // Check if already claimed today
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startISO = startOfDay.toISOString();
    const endISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const todayCount = await env.D1_DB.prepare(
      "SELECT COUNT(*) AS cnt FROM share_rewards WHERE user_id = ? AND reward_type = ? AND claimed_at >= ? AND claimed_at < ?"
    ).first<{ cnt: number }>(userId, REWARD_TYPE, startISO, endISO);

    if ((todayCount?.cnt ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "SHARE_REWARD_USED",
          error: "今天已领取分享奖励，明天再来吧"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Grant one style-upgrade access
    const reportId = "share_" + Date.now() + "_" + userId;
    const result = await reportAccessService.grantReportAccess(userId, reportId, "style-upgrade");

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "GRANT_FAILED",
          error: result.error || "Failed to grant access"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Record the share reward
    try {
      await env.D1_DB.prepare(
        "INSERT INTO share_rewards (id, user_id, reward_type, claimed_at, expire_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(
        crypto.randomUUID(), userId, REWARD_TYPE, new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      ).run();
    } catch (e) {
      console.error("[share/reward] Failed to record:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "SHARE_REWARD_GRANTED",
        message: "已获得一次进阶风格分析",
        reportId
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[beauty/share/reward] Error:", err);
    return new Response(
      JSON.stringify({ success: false, status: "SERVER_ERROR", error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
