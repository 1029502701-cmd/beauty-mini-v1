import type { SessionService } from "../../lib/session";

export interface WechatBindRequest {
  wechatOpenId: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface WechatBindResponse {
  success: boolean;
  userId: string;
  sessionId?: string;
  merged: boolean;
  message?: string;
}

/**
 * POST /api/wechat/bind (legacy compatibility endpoint)
 * Accepts pre-obtained wechatOpenId and binds it to the current session's user.
 */
export async function wechatBind(
  body: WechatBindRequest,
  env: any,
  sessionService: SessionService,
  currentSessionId: string,
  currentUserId: string,
  currentGuestId: string | null,
): Promise<Response> {
  const { wechatOpenId, nickname, avatarUrl } = body;

  if (!wechatOpenId) {
    return new Response(
      JSON.stringify({ success: false, userId: currentUserId, merged: false, message: "缺少 wechatOpenId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let userId = currentUserId;
  let merged = false;

  try {
    const existing = await env.D1_DB.prepare(
      "SELECT id FROM users WHERE open_id = ?",
    ).first<{ id: number }>("open_id");

    if (existing) {
      userId = String(existing.id);
      // If openid already has a different user, that's a conflict
      if (userId !== currentUserId) {
        return new Response(
          JSON.stringify({ success: false, userId, merged: false, message: "该微信账号已绑定其他用户" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      const insertResult = await env.D1_DB.prepare(
        "INSERT INTO users (open_id, nickname, avatar_url, created_at) VALUES (?, ?, ?, ?) RETURNING id",
      ).bind(wechatOpenId, nickname || null, avatarUrl || null, new Date().toISOString())
       .first<{ id: number }>();
      if (insertResult) {
        userId = String(insertResult.id);
      }
    }
  } catch (err) {
    console.error("[wechat-bind] D1 error:", err);
    return new Response(
      JSON.stringify({ success: false, userId: currentUserId, merged: false, message: "绑定失败" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Update the session to mark as non-guest with wechat binding
  const updatedSession = await sessionService.updateToWechatSession(currentSessionId, userId, wechatOpenId);
  if (updatedSession) {
    merged = false; // Not merging — just binding
  }

  return new Response(
    JSON.stringify({
      success: true,
      userId,
      sessionId: currentSessionId,
      merged,
      message: "微信绑定成功",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
