/**
 * Unified API Request Wrapper
 *
 * Provides request() supporting GET/POST with automatic API_BASE prefix,
 * JSON handling, error catching, and session header injection.
 * Also supports file upload via wx.uploadFile.
 */

import { apiClient, getAPIBase } from "@/services/api-client";
import { getStorage } from "@/utils/storage";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function request<T = unknown>(
  path: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<ApiResponse<T>> {
  console.log("REQUEST ARGS:", { method, path, body });

  if (method === "GET") {
    return apiClient.get<T>(path);
  }

  return apiClient.post<T>(path, body);
}

/**
 * Get a single report by reportId
 */
export async function getReport(reportId: string): Promise<{ success: boolean; report?: Record<string, unknown>; error?: string }> {
  try {
    const response = await apiClient.get<{ report: Record<string, unknown>; balance: number }>(
      "/api/beauty/report/query?id=" + encodeURIComponent(reportId)
    );
    if (response.success && response.data) {
      const raw = response.data.report;
      const reportLevel = (raw.level as string) || "first-look";
      const { level: _ignored, ...rest } = raw;
      const report = {
        level: reportLevel,
        ...(_ignored as unknown as Record<string, unknown>),
        ...(rest as Record<string, unknown>),
      };
      return { success: true, report };
    }
    return { success: false, error: response.error || "报告查询失败" };
  } catch {
    return { success: false, error: "报告查询失败" };
  }
}

/**
 * Get list of reports for the current user
 */
export async function getReports(): Promise<{ success: boolean; reports?: Array<{ reportId: string; reportCode: string; createdAt: string; styleName: string }>; error?: string }> {
  try {
    const response = await apiClient.get<{ reports: Array<{ reportId: string; reportCode: string; createdAt: string; styleName: string }> }>(
      "/api/profile"
    );
    if (response.success && response.data && response.data.reports) {
      return { success: true, reports: response.data.reports };
    }
    return { success: false, error: response.error || "报告列表查询失败" };
  } catch {
    return { success: false, error: "报告列表查询失败" };
  }
}

export const api = {
  get: <T = unknown>(path: string) => apiClient.get<T>(path),
  post: <T = unknown>(path: string, body?: unknown) => apiClient.post<T>(path, body),
  request,
};