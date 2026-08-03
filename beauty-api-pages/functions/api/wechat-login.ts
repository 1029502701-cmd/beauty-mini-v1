import { SessionService } from "../../lib/session";
import type { Env } from "../types";

export interface WechatLoginRequest {
  code: string;
  guestUserId?: string;
  guestId?: string;
}

export interface WechatLoginResponse {
  status: "success" | "error";
  sessionId?: string;
  userId?: string;
  isGuest: boolean;
  merged?: boolean;
  message?: string;
}

/**
 * POST /api/wechat-login
 *
 * Flow:
 * 1. Receive wx.login() code from client
 * 2. Exchange code for openid via WeChat code2session API
 * 3. Look up or create user in D1
 * 4. Create or link KV session
 * 5. Return sessionId + userId
 */
export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;
  const sessionService = new SessionService(env.USER_CACHE);

  let body: WechatLoginRequest;
  try {
    body = (await request.json()) as WechatLoginRequest;
  } catch {
    return new Response(
      JSON.stringify({ status: "error", isGuest: false, message: "请求体解析失败" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { code, guestUserId, guestId } = body;

  if (!code) {
    return new Response(
      JSON.stringify({ status: "error", isGuest: false, message: "缺少微信登录 code" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Step 1: Exchange code for openid via WeChat API
  const appid = env.WECHAT_APP_ID;
  const secret = env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    console.error("[wechat-login] WECHAT_APP_ID / WECHAT_APP_SECRET not configured");
    return new Response(
      JSON.stringify({ status: "error", isGuest: !!guestUserId, message: "微信登录服务未配置" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let openid: string;
  try {
    const tokenRes = await fetch(
      "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + appid + "&secret=" + secret + "&code=" + code + "&grant_type=authorization_code",
    );
    const tokenData = (await tokenRes.json()) as Record<string, unknown>;
    if (tokenData.errcode) {
      console.error("[wechat-login] code2session error:", tokenData);
      return new Response(
        JSON.stringify({ status: "error", isGuest: !!guestUserId, message: "微信登录失败，code无效" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    openid = tokenData.openid as string;
    if (!openid) {
      return new Response(
        JSON.stringify({ status: "error", isGuest: !!guestUserId, message: "微信登录失败：未获取到openid" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    console.error("[wechat-login] code2session request failed:", err);
    return new Response(
      JSON.stringify({ status: "error", isGuest: !!guestUserId, message: "微信登录请求失败" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Step 2: Find or create user in D1
  let userId: string;
  let merged = false;

  try {
    const existing = await env.D1_DB.prepare(
      "SELECT id FROM users WHERE open_id = ?",
    ).first<{ id: number }>("open_id");

    if (existing) {
      userId = String(existing.id);
    } else {
      const insertResult = await env.D1_DB.prepare(
        "INSERT INTO users (open_id, created_at) VALUES (?, ?) RETURNING id",
      ).bind(openid, new Date().toISOString()).first<{ id: number }>();
      if (!insertResult) {
        return new Response(
          JSON.stringify({ status: "error", isGuest: false, message: "用户创建失败" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      userId = String(insertResult.id);
    }
  } catch (err) {
    console.error("[wechat-login] D1 user operation failed:", err);
    userId = "wechat_" + openid.slice(0, 8);
  }

  // Step 3: Handle guest session merge
  let sessionRecord;
  if (guestUserId && guestId) {
    sessionRecord = await sessionService.updateToWechatSession(guestUserId, userId, openid);
    if (sessionRecord) {
      merged = true;
    }
  }

  // Step 4: Ensure a session exists (create fresh if merge didn't find one)
  if (!sessionRecord) {
    sessionRecord = await sessionService.createAuthSession(userId, openid, guestId || null);
  }

  console.log("[wechat-login] session created:", sessionRecord.sessionId, "userId:", sessionRecord.userId, "isGuest:", sessionRecord.isGuest);
  return new Response(
    JSON.stringify({
      status: "success",
      sessionId: sessionRecord.sessionId,
      userId: sessionRecord.userId,
      isGuest: sessionRecord.isGuest,
      merged,
      message: merged ? "微信账号已绑定，游客数据已迁移" : "微信登录成功",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
