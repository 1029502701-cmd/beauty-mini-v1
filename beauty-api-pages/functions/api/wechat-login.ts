import { TokenService } from "../../modules/token/token-service";
import { SessionService, extractSessionId } from "../../lib/session";
import type { Env } from "../types";

export interface WechatLoginRequest {
  code: string;
  guestUserId?: string;
  guestId?: string;
  sessionId?: string;
}

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
    return new Response(JSON.stringify({ status: "error", isGuest: true, message: "请求体解析失败" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { code, guestUserId, guestId, sessionId } = body;
  const fallbackUserId = guestUserId || "guest_" + Date.now();

  // --- Guest fallback: no code provided ---
  if (!code) {
    let userId = fallbackUserId;
    // Ensure user exists in D1
    try {
      await env.D1_DB.prepare(
        "INSERT OR IGNORE INTO users (id, open_id, created_at) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM users), ?, ?)"
      ).bind(userId, new Date().toISOString()).run();
    } catch (e) {
      console.error("[wechat-login] D1 insert error:", e);
    }
    const sid = sessionId || null;
    if (sid) {
      const existing = await sessionService.validate(sid);
      if (existing) {
        return new Response(JSON.stringify({ status: "success", sessionId: sid, userId, isGuest: true, merged: false }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }
    const record = await sessionService.createGuestSession(guestId || "guest", userId);
    return new Response(JSON.stringify({ status: "success", sessionId: record.sessionId, userId: record.userId, isGuest: true, merged: false }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // --- Normal WeChat login flow ---
  const appid = env.WECHAT_APP_ID;
  const secret = env.WECHAT_APP_SECRET;

  let openid: string | null = null;
  if (appid && secret) {
    try {
      const wechatUrl = "https://api.weixin.qq.com/sns/jscode2session?appid=" + appid + "&secret=" + secret + "&js_code=" + code + "&grant_type=authorization_code";
      const tokenRes = await fetch(wechatUrl);
      const tokenData = await tokenRes.json() as Record<string, unknown>;
      if (tokenData.errcode) {
        console.error("[wechat-login] code2session error:", tokenData);
      } else {
        openid = tokenData.openid as string;
      }
    } catch (err) {
      console.error("[wechat-login] code2session failed:", err);
    }
  } else {
    console.log("[wechat-login] WECHAT_APP_ID/SECRET not configured, using guest fallback");
  }

  // --- Create or resolve user ---
  let userId: string;
  if (openid) {
    try {
      const existing = await env.D1_DB.prepare("SELECT id FROM users WHERE open_id = ?").first<{ id: number }>(openid);
      if (existing) {
        userId = String(existing.id);
      } else {
        const insertResult = await env.D1_DB.prepare(
          "INSERT INTO users (open_id, created_at) VALUES (?, ?) RETURNING id"
        ).bind(openid, new Date().toISOString()).first<{ id: number }>();
        userId = insertResult ? String(insertResult.id) : fallbackUserId;
        try {
          const tokenService = new TokenService(env.D1_DB);
          await tokenService.add(userId, 1, "New user welcome gift");
        } catch (e) {
          console.error("[wechat-login] Failed to grant welcome token:", e);
        }
      }
    } catch (err) {
      console.error("[wechat-login] D1 user error:", err);
      userId = fallbackUserId;
    }
  } else {
    // Guest fallback: create user in D1
    userId = fallbackUserId;
    try {
      await env.D1_DB.prepare(
        "INSERT OR IGNORE INTO users (id, open_id, created_at) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM users), ?, ?)"
      ).bind(userId, new Date().toISOString()).run();
    } catch (e) {
      console.error("[wechat-login] D1 insert error:", e);
    }
  }

  // --- Create or update session ---
  let sessionRecord;
  if (guestUserId && guestId && sessionId) {
    sessionRecord = await sessionService.updateToWechatSession(sessionId, userId, openid || "");
    if (!sessionRecord) {
      sessionRecord = await sessionService.createGuestSession(guestId, userId);
    }
  } else {
    sessionRecord = await sessionService.createGuestSession(guestId || "guest", userId);
  }

  console.log("[wechat-login] session created:", sessionRecord.sessionId, "userId:", sessionRecord.userId, "isGuest:", sessionRecord.isGuest);
  return new Response(JSON.stringify({
    status: "success",
    sessionId: sessionRecord.sessionId,
    userId: sessionRecord.userId,
    isGuest: sessionRecord.isGuest,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}