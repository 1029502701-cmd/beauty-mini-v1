/**
 * WeChat Authentication Service
 * Connects to beauty-api-pages backend via POST /api/wechat-login.
 *
 * Flow:
 * 1. wx.login() -> obtains temporary code
 * 2. POST /api/wechat-login with { code, guestUserId, guestId, sessionId } -> server exchanges code2session
 * 3. Server returns sessionId (stored in userService)
 * 4. All subsequent API calls carry X-Session-Id header
 */

import { setStorage, getStorage, removeStorage, isWeChatMiniProgram } from "@/utils/storage";
import userService from "./user-service";
import { api } from "./api-client";

interface WechatLoginResult {
  success: boolean;
  code?: string;
  error?: string;
}

interface ServerLoginResult {
  success: boolean;
  sessionId?: string;
  userId?: string;
  isGuest: boolean;
  merged?: boolean;
  error?: string;
  status?: string;
}

const SESSION_STORAGE_KEY = "sessionId";
const SERVER_LOGIN_CODE_TTL_MS = 5 * 60 * 1000;

class WechatAuthService {
  private wechatCode: string | null = null;
  private codeObtainedAt = 0;
  private serverSessionId: string | null = null;

    async login(): Promise<WechatLoginResult> {
    if (typeof wx === "undefined" || typeof wx.login !== "function") {
      return {
        success: false,
        error: "当前环境不支持微信登录"
      };
    }

    return new Promise<WechatLoginResult>((resolve) => {

      wx.login({

        success: (res) => {

          console.log("[wx.login success]", res);

          if (res.code && res.code.length > 0) {

            this.wechatCode = res.code;
            this.codeObtainedAt = Date.now();

            resolve({
              success: true,
              code: res.code
            });

          } else {

            console.error("[wx.login no code]", res);

            resolve({
              success: false,
              error: "微信没有返回code"
            });

          }

        },

        fail: (err) => {

          console.error("[wx.login fail]", err);

          resolve({
            success: false,
            error: err.errMsg
          });

        }

      });

    });
  }

  async getValidLoginCode(): Promise<WechatLoginResult> {
    const now = Date.now();
    if (this.wechatCode && (now - this.codeObtainedAt) < SERVER_LOGIN_CODE_TTL_MS) {
      return { success: true, code: this.wechatCode };
    }
    return this.login();
  }

  /**
   * Full login flow: get wx.login code -> POST /api/wechat-login -> store sessionId
   */
  async performServerLogin(guestUserId?: string, guestId?: string): Promise<ServerLoginResult> {
    console.log("[WechatAuth] performServerLogin START, guestUserId:", guestUserId, "guestId:", guestId);
    const codeResult = await this.getValidLoginCode();
    console.log(
  "[DEBUG] wx login code:",
  codeResult.code
);
    console.log("[WechatAuth] login code result:", codeResult.success, codeResult.code ? "code=" + codeResult.code.slice(0,8) + "..." : "no code", codeResult.error);
    if (!codeResult.success || !codeResult.code) {
      return { success: false, isGuest: true, error: codeResult.error };
    }

    // Read existing sessionId from storage to enable server-side session merge
    const existingSid = getStorage<string>(SESSION_STORAGE_KEY, null);
    console.log("[WechatAuth] existing sessionId from storage:", existingSid ? existingSid.slice(0,8) + "..." : "null");

    try {
      console.log("[WechatAuth] posting to /api/wechat-login with guestUserId:", guestUserId, "sessionId:", existingSid);
      console.log("[wechat-login payload]", {
  code: codeResult.code,
  guestUserId,
  guestId,
  sessionId: existingSid
});
      const response = await api.post("/api/wechat-login", {
        code: codeResult.code,
        guestUserId,
        guestId,
        sessionId: existingSid || undefined
      });

      if (response.success && response.data) {
        const data = response.data as {
          status?: string;
          sessionId?: string;
          userId?: string;
          isGuest: boolean;
          merged?: boolean;
          message?: string;
        };

        if (data.status !== "success" || !data.sessionId) {
          console.error("[WechatAuth] login failed", response.data);
          return { success: false, isGuest: true, error: data.message || "微信登录失败" };
        }

        this.serverSessionId = data.sessionId;
        console.log("[WechatAuth] serverSessionId:", this.serverSessionId);

        if (this.serverSessionId) {
          setStorage(SESSION_STORAGE_KEY, this.serverSessionId);
          userService.setServerSessionId(this.serverSessionId);
          console.log("[WechatAuth] session saved", this.serverSessionId);
        }

        return {
          success: true,
          sessionId: this.serverSessionId,
          userId: data.userId,
          isGuest: data.isGuest !== false,
          merged: data.merged
        };
      }

      return { success: false, isGuest: true, error: response.error || "登录失败" };
   } catch (e) {
  console.error("[wechat-login catch]", e);
  return { success: false, isGuest: true, error: "网络异常，请重试" };
}
  }

  getServerSessionId(): string | null {
    if (this.serverSessionId) return this.serverSessionId;
    return getStorage<string>(SESSION_STORAGE_KEY, null);
  }

  isAuthenticated(): boolean {
    return !!this.getServerSessionId();
  }

  clearLoginState(): void {
    this.wechatCode = null;
    this.codeObtainedAt = 0;
    this.serverSessionId = null;
    removeStorage(SESSION_STORAGE_KEY);
  }

  private convertWechatError(errMsg: string): string {
    if (errMsg.includes("cancel") || errMsg.includes("Cancel")) return "已取消微信登录";
    if (errMsg.includes("network")) return "网络异常，请检查网络连接后重试";
    return "微信登录失败，请稍后重试";
  }
}

const wechatAuthService = new WechatAuthService();
export { wechatAuthService, WechatAuthService };
export default wechatAuthService;