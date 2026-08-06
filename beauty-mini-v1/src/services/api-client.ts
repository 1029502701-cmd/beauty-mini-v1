/**
 * API Client Abstraction Layer
 *
 * WeChat Mini Program environment: uses wx.request
 * H5 environment: uses fetch
 *
 * All business interfaces must go through this client layer.
 * Session-based auth: X-Session-Id header injected from userService.
 */

const ENV = {
  get current(): "development" | "production" {
    return "production";
  }
};

const API_BASE_CONFIG = {
  development: "https://beauty-api-pages.pages.dev/",
  production: "https://beauty-api-pages.pages.dev/"
};

export function getAPIBase(): string {
  const env = ENV.current;
  return env === "production" ? API_BASE_CONFIG.production : API_BASE_CONFIG.development;
}

const ERROR_MESSAGES = {
  NETWORK_ERROR: "网络异常，请稍后重试",
  SERVER_ERROR: "服务器繁忙，请稍后重试",
  NOT_FOUND: "请求的资源不存在",
  AUTH_ERROR: "请先登录或检查账户权限",
  UPLOAD_ERROR: "图片上传失败，请重试",
  ANALYZE_ERROR: "分析失败，请重试",
  UNKNOWN_ERROR: "发生未知错误，请联系客服",
  TIMEOUT_ERROR: "请求超时，请检查网络连接",
  CANCEL_ERROR: "已取消操作"
};

export function sanitizeResponse<T>(data: any): T {
  if (data?.analysis) {
    delete data.analysis.FaceMetrics;
    delete data.analysis.rawImageData;
    delete data.analysis.internalParams;
    delete data.analysis._private;
  }
  if (data?.imageUrl && !data.includeRawImage) {
    delete data.imageUrl;
  }
  return data as T;
}

function getSessionHeader(): { "X-Session-Id": string } | null {
  try {
    const userService = require("./user-service").default;
    const sessionId = userService.getServerSessionId();
    if (sessionId) {
      return { "X-Session-Id": sessionId };
    }
  } catch {
    // userService not ready yet
  }
  return null;
}

export class ApiClient {
  private readonly TIMEOUT = 15000;
  private _baseUrl: string;

  constructor(baseUrl?: string) {
    this._baseUrl = baseUrl || getAPIBase();
  }

  get baseUrl(): string { return this._baseUrl; }
  set baseUrl(v: string) { this._baseUrl = v; }

  private wxRequest<T>(method: "GET" | "POST", path: string, body?: any): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    return new Promise((resolve) => {
      const url = this._baseUrl.replace(/\/$/, "") + path;
      console.log("[API DEBUG]", { baseUrl: this._baseUrl, path, url });

      const header: Record<string, string> = { "Content-Type": "application/json" };
      const sessionHeader = getSessionHeader();
      if (sessionHeader) {
        Object.assign(header, sessionHeader);
      }

      wx.request({
        url,
        method: method as any,
        data: body,
        header,
        timeout: this.TIMEOUT,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = res.data;
              const sanitized = sanitizeResponse<T>(data);
              resolve({ success: true, data: sanitized, message: "OK" });
            } catch {
              resolve({ success: false, error: ERROR_MESSAGES.UNKNOWN_ERROR, message: ERROR_MESSAGES.UNKNOWN_ERROR });
            }
          } else if (res.statusCode === 401) {
            try {
              const userService = require("./user-service").default;
              userService.logout();
            } catch {}
            resolve({ success: false, error: ERROR_MESSAGES.AUTH_ERROR, message: ERROR_MESSAGES.AUTH_ERROR });
          } else if (res.statusCode === 403) {
            try {
              const data = res.data as { status?: string; error?: string; balance?: number };
              if (data?.status === "DAILY_LIMIT_REACHED") {
                resolve({ success: false, error: data.error || "今天次数已用完，请明天再试", message: data.error || "DAILY_LIMIT_REACHED" });
              } else if (data?.status === "INSUFFICIENT_TOKEN") {
                resolve({ success: false, error: data.error || "Token不足，请先解锁", message: data.error || "INSUFFICIENT_TOKEN" });
              } else if (data?.status === "SHARE_REWARD_USED") {
                resolve({ success: false, error: data.error || "今天已领取分享奖励", message: "SHARE_REWARD_USED" });
              } else if (data?.status === "SHARE_REWARD_GRANTED") {
                resolve({ success: true, data: data as T, message: "SHARE_REWARD_GRANTED" });
              } else {
                resolve({ success: false, error: data?.error || ERROR_MESSAGES.AUTH_ERROR, message: data?.error || "403" });
              }
            } catch {
              resolve({ success: false, error: ERROR_MESSAGES.AUTH_ERROR, message: ERROR_MESSAGES.AUTH_ERROR });
            }
          } else if (res.statusCode === 404) {
            resolve({ success: false, error: ERROR_MESSAGES.NOT_FOUND, message: ERROR_MESSAGES.NOT_FOUND });
          } else if (res.statusCode >= 500) {
            resolve({ success: false, error: ERROR_MESSAGES.SERVER_ERROR, message: ERROR_MESSAGES.SERVER_ERROR });
          } else {
            resolve({ success: false, error: ERROR_MESSAGES.NETWORK_ERROR, message: ERROR_MESSAGES.NETWORK_ERROR });
          }
        },
        fail: (err) => {
          let message = ERROR_MESSAGES.NETWORK_ERROR;
          if (err.errMsg?.includes("timeout") || err.errMsg?.includes("Timeout")) {
            message = ERROR_MESSAGES.TIMEOUT_ERROR;
          }
          resolve({ success: false, error: message, message });
        }
      });
    });
  }

  private fetchRequest<T>(method: "GET" | "POST", path: string, body?: any): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const sessionHeader = getSessionHeader();
      if (sessionHeader) {
        Object.assign(headers, sessionHeader);
      }

      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      fetch(this._baseUrl + path, options)
        .then(async (res) => {
          clearTimeout(timeoutId);
          if (!res.ok) {
            let text = "";
            try { text = await res.text(); } catch {}
            if (res.status === 401) {
              try {
                const userService = require("./user-service").default;
                userService.logout();
              } catch {}
              throw new Error("401");
            }
            if (res.status === 403) throw new Error("403:" + text);
            if (res.status === 404) throw new Error("404");
            if (res.status >= 500) throw new Error("500:" + text);
            throw new Error("HTTP " + res.status);
          }
          const data = await res.json();
          const sanitized = sanitizeResponse<T>(data);
          resolve({ success: true, data: sanitized, message: "OK" });
        })
        .catch((e) => {
          clearTimeout(timeoutId);
          let message = ERROR_MESSAGES.UNKNOWN_ERROR;
          if (e.name === "AbortError") {
            message = ERROR_MESSAGES.TIMEOUT_ERROR;
          } else if (e.message === "401") {
            message = ERROR_MESSAGES.AUTH_ERROR;
          } else if (e.message?.startsWith("403:")) {
            try {
              const data = JSON.parse(e.message.slice(4)) as { status?: string; error?: string };
              if (data.status === "DAILY_LIMIT_REACHED") message = data.error || "今天次数已用完，请明天再试";
              else if (data.status === "INSUFFICIENT_TOKEN") message = data.error || "Token不足，请先解锁";
              else if (data.status === "SHARE_REWARD_USED") message = "今天已领取分享奖励";
              else if (data.status === "SHARE_REWARD_GRANTED") message = "已获得一次进阶风格分析";
              else message = data.error || ERROR_MESSAGES.AUTH_ERROR;
            } catch {
              message = ERROR_MESSAGES.AUTH_ERROR;
            }
          } else if (e.message?.startsWith("500:")) {
            message = ERROR_MESSAGES.SERVER_ERROR;
          } else if (e.message?.startsWith("HTTP")) {
            message = ERROR_MESSAGES.NETWORK_ERROR;
          } else {
            message = ERROR_MESSAGES.NETWORK_ERROR;
          }
          resolve({ success: false, error: message, message });
        });
    });
  }

  async get<T = unknown>(path: string): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const isWeChat = typeof wx !== "undefined" && wx.request;
    if (isWeChat) return this.wxRequest<T>("GET", path);
    return this.fetchRequest<T>("GET", path);
  }

  async post<T = unknown>(path: string, body?: any): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const isWeChat = typeof wx !== "undefined" && wx.request;
    if (isWeChat) return this.wxRequest<T>("POST", path, body);
    return this.fetchRequest<T>("POST", path, body);
  }

  setEnvironment(type: "development" | "production"): void {
    if (typeof wx !== "undefined" && wx.setStorageSync) {
      wx.setStorageSync("apiEnvironment", type);
    }
    this._baseUrl = getAPIBase();
  }

  resetBaseUrl(): void {
    this._baseUrl = getAPIBase();
  }
}

export const apiClient = new ApiClient(getAPIBase());

export const api = {
  get: (path: string) => apiClient.get(path),
  post: (path: string, body: any) => apiClient.post(path, body),
  setEnvironment: (type: "development" | "production") => { apiClient.setEnvironment(type); },
  getEndpoint(): string { return apiClient.baseUrl; }
};

apiClient.baseUrl = getAPIBase();

export function injectSessionHeader(headers: Record<string, string>): void {
  try {
    const sid = require("./user-service").default.getServerSessionId();
    console.log("[api-client] injectSessionHeader: sid=", sid ? sid.slice(0,8) + "..." : "NULL");
    if (sid) headers["X-Session-Id"] = sid;
  } catch (e) {
    console.error("[api-client] injectSessionHeader error:", e);
  }
}