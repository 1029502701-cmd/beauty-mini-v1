import { SessionService, extractSessionId } from "../../lib/session";
import type { Env } from "../types";

export interface ProfileResponse {
  userId: string;
  nickname: string;
  avatar: string;
  styleName: string;
  reports: Array<{
    reportId: string;
    reportCode: string;
    createdAt: string;
    styleName: string;
  }>;
}

/**
 * GET /api/profile
 *
 * Returns the current user's profile and recent reports.
 * Session is resolved from X-Session-Id or Authorization header.
 * Falls back to mock data if no valid session is provided.
 */
export async function onRequestGet(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;
  const sessionService = new SessionService(env.USER_CACHE);

  const sessionId = extractSessionId(request);
  const session = await sessionService.validate(sessionId);

  let userId: string | null = null;
  if (session) {
    userId = session.userId;
  }

  try {
    if (userId) {
      const [profileRow, reportRows] = await Promise.all([
        env.D1_DB.prepare(
          "SELECT id, nickname, avatar_url, style_name FROM users WHERE id = ?",
        ).first<{ nickname: string; avatar_url: string; style_name: string }>(userId),
        env.D1_DB.prepare(
          "SELECT id as report_id, code as report_code, created_at, style_name FROM beauty_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
        ).all<{ report_id: string; report_code: string; created_at: string; style_name: string }>(userId),
      ]);

      const response: ProfileResponse = {
        userId,
        nickname: profileRow?.nickname || `用户${userId}`,
        avatar: profileRow?.avatar_url || "",
        styleName: profileRow?.style_name || "",
        reports: (reportRows?.results ?? []).map((r) => ({
          reportId: String(r.report_id),
          reportCode: r.report_code || "",
          createdAt: r.created_at || "",
          styleName: r.style_name || "",
        })),
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: ProfileResponse = {
      userId: "current_user_id",
      nickname: "张三",
      avatar: "https://example.com/avatar.jpg",
      styleName: "清透自然型",
      reports: [
        {
          reportId: "report_001",
          reportCode: "BM202607300001",
          createdAt: "2026-07-25T10:30:00Z",
          styleName: "清透自然型",
        },
        {
          reportId: "report_002",
          reportCode: "BM202607200002",
          createdAt: "2026-07-20T14:15:00Z",
          styleName: "日系清新型",
        },
        {
          reportId: "report_003",
          reportCode: "BM202607100003",
          createdAt: "2026-07-10T09:45:00Z",
          styleName: "欧美浓妆型",
        },
      ],
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[profile] Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch profile" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}