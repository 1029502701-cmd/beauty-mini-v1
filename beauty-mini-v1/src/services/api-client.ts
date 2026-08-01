/**
 * API Client Abstraction Layer
 *
 * WeChat Mini Program environment: uses wx.request
 * H5 environment: uses fetch
 *
 * All business interfaces must go through this client layer.
 * Session-based auth: X-Session-Id header injected from userService.
 */

// ==================== Environment Configuration ====================

import { setStorage } from "@/utils/storage";

export const ENV = {
  get current(): "development" | "production" {
    if (typeof wx !== "undefined" && wx.getStorageSync) {
      return "production";
    }
    return import.meta.env?.MODE === "production" ? "production" : "development";
  }
};

// ==================== API Base URL Configuration ====================

const API_BASE_CONFIG = {
  development: "https://beauty-api-pages.pages.dev",
  production: "https://beauty-api-pages.pages.dev"
};

export function getAPIBase(): string {
  const env = ENV.current;
  if (typeof wx !== "undefined" && wx.getStorageSync) {
    const isDebug = typeof wx.getSystemInfoSync !== "undefined"
      && wx.getSystemInfoSync().environment === "develop";
    return isDebug ? API_BASE_CONFIG.development : API_BASE_CONFIG.production;
  }
  return env === "production" ? API_BASE_CONFIG.production : API_BASE_CONFIG.development;
}

// ==================== Error Message Configuration ====================

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

// ==================== Security Response Filter ====================
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

// ==================== WeChat Upload Error Code Mapping ====================

export function mapWechatUploadError(wxErrMsg: string): string {
  if (!wxErrMsg) return ERROR_MESSAGES.UPLOAD_ERROR;
  if (wxErrMsg.includes("cancel") || wxErrMsg.includes("Cancel")) {
    return "已取消上传";
  }
  if (wxErrMsg.includes("timeout") || wxErrMsg.includes("Timeout")) {
    return "上传超时，请检查网络后重试";
  }
  if (wxErrMsg.includes("fail")) {
    return "网络异常，请重试";
  }
  return ERROR_MESSAGES.UPLOAD_ERROR;
}

// ==================== Session Header Helpers ====================

/**
 * Read the current session ID from storage and return it as a header value.
 * Returns null if no session is present (guest mode).
 */
function getSessionHeader(): { "X-Session-Id": string } | null {
  try {
    // Lazy import to avoid circular dependency at module load time
    const userService = require("./user-service").default;
    const sessionId = userService.getServerSessionId();
    if (sessionId) {
      return { "X-Session-Id": sessionId };
    }
  } catch {
    // userService not ready yet — session will be null
  }
  return null;
}

// ==================== ApiClient Class ====================

export class ApiClient {
  private readonly TIMEOUT = 15000;
  private _baseUrl: string;

  constructor(baseUrl?: string) {
    this._baseUrl = baseUrl || getAPIBase();
  }

  get baseUrl(): string { return this._baseUrl; }
  set baseUrl(v: string) { this._baseUrl = v; }

  /**
   * WeChat mini program request wrapper
   */
  private wxRequest<T>(method: "GET" | "POST", path: string, body?: any): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    return new Promise((resolve) => {
      const url = this._baseUrl + path;
      const sessionHeader = getSessionHeader();
      const header: Record<string, string> = { "Content-Type": "application/json" };
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
            // Session expired — clear it and retry without session
            try {
              const userService = require("./user-service").default;
              userService.logout();
            } catch {}
            resolve({ success: false, error: ERROR_MESSAGES.AUTH_ERROR, message: ERROR_MESSAGES.AUTH_ERROR });
          } else if (res.statusCode === 403) {
            resolve({ success: false, error: ERROR_MESSAGES.AUTH_ERROR, message: ERROR_MESSAGES.AUTH_ERROR });
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

  /**
   * H5/fetch request wrapper
   */
  private fetchRequest<T>(method: "GET" | "POST", path: string, body?: any): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const sessionHeader = getSessionHeader();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
            if (res.status === 401) {
              try {
                const userService = require("./user-service").default;
                userService.logout();
              } catch {}
              throw new Error("401");
            }
            if (res.status === 403) throw new Error("403");
            if (res.status === 404) throw new Error("404");
            if (res.status >= 500) throw new Error("500");
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
          } else if (e.message === "403") {
            message = ERROR_MESSAGES.AUTH_ERROR;
          } else if (e.message === "404") {
            message = ERROR_MESSAGES.NOT_FOUND;
          } else if (e.message === "500") {
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
    if (isWeChat) {
      return this.wxRequest<T>("GET", path);
    }
    return this.fetchRequest<T>("GET", path);
  }

  async post<T = unknown>(path: string, body: any): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
    const isWeChat = typeof wx !== "undefined" && wx.request;
    if (isWeChat) {
      return this.wxRequest<T>("POST", path, body);
    }
    return this.fetchRequest<T>("POST", path, body);
  }

  setEnvironment(type: "development" | "production"): void {
    if (typeof wx !== "undefined" && wx.setStorageSync) {
      wx.setStorageSync("apiEnvironment", type);
    } else {
      setStorage("apiEnvironment", type);
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
  setEnvironment: (type: "development" | "production") => {
    apiClient.setEnvironment(type);
  },
  getEndpoint(): string {
    return apiClient.baseUrl;
  }
};

apiClient.baseUrl = getAPIBase();
console.log("[API Client] Environment:", ENV.current, "| Endpoint:", apiClient.baseUrl);


// ==================== Session Header Injection ====================
export function injectSessionHeader(headers: Record<string, string>): void {
  try {
    const sid = require("./user-service").default.getServerSessionId();
    if (sid) headers["X-Session-Id"] = sid;
  } catch {}
}

