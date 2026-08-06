import type { SessionService } from "../../lib/session";

export interface WechatLoginRequest {
  code: string;
  guestUserId?: string;
  guestId?: string;
  /** KV session token stored on the client side (from wx.getStorageSync("sessionId")) */
  sessionId?: string;
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
 * POST /api/wechat/login
 *
 * Flow:
 * 1. Receive wx.login() code from client
 * 2. Exchange code for openid via WeChat code2session API
 * 3. Look up or create user in D1
 * 4. Create or link KV session (merge guest if sessionId provided)
 * 5. Return sessionId + userId
 */
export async function wechatLogin(
  body: WechatLoginRequest,
  env: any,
  sessionService: SessionService,
): Promise<Response> {
  const { code, guestUserId, guestId, sessionId } = body;

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
    const tokenData = await tokenRes.json() as Record<string, unknown>;
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
    ).first<any>(openid);

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
  // Use sessionId from client (KV token) to find and update existing guest session.
  // Fix: was incorrectly passing guestUserId (format: user_xxx) as sessionId.
  let sessionRecord;
  if (sessionId) {
    sessionRecord = await sessionService.updateToWechatSession(sessionId, userId, openid);
    if (sessionRecord) {
      merged = true;
    }
  } else if (guestUserId && guestId) {
    // Fallback: no sessionId available, create new session linked by guestId
    sessionRecord = await sessionService.createAuthSession(userId, openid, guestId);
  }

  // Step 4: Ensure a session exists
  if (!sessionRecord) {
    sessionRecord = await sessionService.createAuthSession(userId, openid, guestId || null);
  }

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