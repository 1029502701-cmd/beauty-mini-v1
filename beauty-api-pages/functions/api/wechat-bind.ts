import { SessionService, extractSessionId } from "../../lib/session";
import type { Env } from "../types";

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
 * POST /api/wechat-bind
 *
 * Accepts a pre-obtained wechatOpenId and binds it to the current session's user.
 * Session is extracted from X-Session-Id or Authorization header.
 */
export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;
  const sessionService = new SessionService(env.USER_CACHE);

  let body: WechatBindRequest;
  try {
    body = (await request.json()) as WechatBindRequest;
  } catch {
    return new Response(
      JSON.stringify({ success: false, userId: "", merged: false, message: "请求体解析失败" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { wechatOpenId, nickname, avatarUrl } = body;

  if (!wechatOpenId) {
    return new Response(
      JSON.stringify({ success: false, userId: "", merged: false, message: "缺少 wechatOpenId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const sessionId = extractSessionId(request);
  if (!sessionId) {
    return new Response(
      JSON.stringify({ success: false, userId: "", merged: false, message: "未登录" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const session = await sessionService.validate(sessionId);
  if (!session) {
    return new Response(
      JSON.stringify({ success: false, userId: "", merged: false, message: "会话已过期" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let userId = session.userId;
  let merged = false;

  try {
    const existing = await env.D1_DB.prepare(
      "SELECT id FROM users WHERE open_id = ?",
    ).first<{ id: number }>(wechatOpenId);

    if (existing) {
      userId = String(existing.id);
      if (userId !== session.userId) {
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
      JSON.stringify({ success: false, userId: session.userId, merged: false, message: "绑定失败" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const updatedSession = await sessionService.updateToWechatSession(sessionId, userId, wechatOpenId);
  if (updatedSession) {
    merged = false;
  }

  return new Response(
    JSON.stringify({
      success: true,
      userId,
      sessionId,
      merged,
      message: "微信绑定成功",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}