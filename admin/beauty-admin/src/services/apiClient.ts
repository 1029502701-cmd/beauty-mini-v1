/**
 * apiClient.ts - Unified API client for Admin Service
 *
 * Features:
 * - Configurable baseURL from env or fallback to relative
 * - Request/response wrapper with common headers
 * - Error handling with typed errors
 * - Token/session header injection
 * - Fallback mode when backend unavailable
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const BACKEND_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BACKEND_URL) ||
  (typeof window !== "undefined"
    ? (window as any).__ADMIN_BACKEND_URL || "https://ai-beauty-workers.workers.dev"
    : "http://localhost:8787");

const DEFAULT_TIMEOUT_MS = 10000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiClientOptions {
  timeoutMs?: number;
  baseUrl?: string;
}

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
}

export interface RequestConfig {
  timeoutMs?: number;
  bypassFallback?: boolean;
  headers?: Record<string, string>;
}

// ─── Session / Token helpers ───────────────────────────────────────────────────

function getSessionId(): string | null {
  try {
    const raw = localStorage.getItem("admin_session");
    if (!raw) return null;
    const session = JSON.parse(raw) as { sessionId?: string; role: string };
    return session.sessionId || null;
  } catch {
    return null;
  }
}

function getAdminToken(): string | null {
  return localStorage.getItem("admin_token") || null;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };
  const sid = getSessionId();
  if (sid) h["X-Admin-Session-Id"] = sid;
  const tok = getAdminToken();
  if (tok) h["Authorization"] = `Bearer ${tok}`;
  return h;
}

// ─── Core client ──────────────────────────────────────────────────────────────

export class ApiClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || BACKEND_URL;
    this.defaultTimeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  private buildUrl(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, "");
    const p = path.replace(/^\/+/, "");
    return `${base}/${p}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown | undefined,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = this.buildUrl(path);
    const timeoutMs = config.timeoutMs ?? this.defaultTimeoutMs;
    const headers = buildHeaders(config.headers);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined && body !== null) {
        fetchOptions.body = JSON.stringify(body);
      }

      const res = await fetch(url, fetchOptions);
      clearTimeout(timer);

      if (!res.ok) {
        let text = "";
        try {
          text = await res.text();
        } catch {
          // ignore
        }
        let parsed: any;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = null;
        }
        const err: ApiError = Object.assign(
          new Error(parsed?.message || res.statusText || `HTTP ${res.status}`),
          { status: res.status, code: parsed?.code, details: parsed?.details }
        );
        throw err;
      }

      if (res.status === 204 || res.headers.get("content-length") === "0") {
        return undefined as unknown as T;
      }
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        const timeoutErr: ApiError = Object.assign(
          new Error(`请求超时 (${timeoutMs}ms)`),
          { status: 0, code: "TIMEOUT" }
        );
        throw timeoutErr;
      }
      throw err;
    }
  }

  get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("GET", path, undefined, config);
  }

  post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>("POST", path, body, config);
  }

  put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>("PUT", path, body, config);
  }

  patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>("PATCH", path, body, config);
  }

  delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("DELETE", path, undefined, config);
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────

export const apiClient = new ApiClient();

// ─── Convenience helpers for service layer ────────────────────────────────────

/**
 * callOrFallback - Attempt API call, return fallback on failure.
 */
export async function callOrFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
