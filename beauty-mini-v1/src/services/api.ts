/**
 * Unified API Request Wrapper
 *
 * Provides request() supporting GET/POST with automatic API_BASE prefix,
 * JSON handling, error catching, and session header injection.
 * Also supports file upload via wx.uploadFile.
 */

import { apiClient, getAPIBase, injectSessionHeader } from "@/services/api-client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Unified request function supporting GET, POST, and file upload.
 * @param method "GET" | "POST"
 * @param path API path (without base URL)
 * @param body POST body (optional)
 * @returns { success, data, error, message }
 */
export async function request<T = unknown>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const sessionHeaders: Record<string, string> = {};
  injectSessionHeader(sessionHeaders);

  if (method === "GET") {
    return apiClient.get<T>(path);
  }

  return apiClient.post<T>(path, body);
}

/**
 * WeChat mini-program file upload helper.
 * @param filePath Local file path from wx.chooseImage
 * @param serverPath Path relative to API_BASE (e.g. "/api/beauty/upload")
 * @param formData Additional form fields
 * @returns { success, data, error, message }
 */
export function uploadFile<T = unknown>(
  filePath: string,
  serverPath: string,
  formData?: Record<string, string>
): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    if (typeof wx === "undefined" || !wx.uploadFile) {
      resolve({ success: false, error: "wx.uploadFile not available" });
      return;
    }
    const url = getAPIBase() + serverPath;
    const sessionHeaders: Record<string, string> = {};
    injectSessionHeader(sessionHeaders);

    wx.uploadFile({
      url,
      filePath,
      name: "image",
      formData: formData || {},
      header: { "Content-Type": "multipart/form-data", ...sessionHeaders },
      timeout: 30000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data);
            resolve({ success: true, data: data as T });
          } catch {
            resolve({ success: false, error: "响应格式错误" });
          }
        } else {
          resolve({ success: false, error: "上传失败，状态码: " + res.statusCode });
        }
      },
      fail: (err) => {
        resolve({ success: false, error: err.errMsg || "上传失败" });
      }
    });
  });
}

/**
 * Get a single report by reportId
 * @param reportId - The report ID to fetch
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
  uploadFile
};