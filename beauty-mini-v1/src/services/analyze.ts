import type { BeautyReport } from "@/types";
import { api, request } from "@/services/api";
import userService from "./user-service";

/**
 * Analysis result from POST /api/beauty/analyze
 */
export interface AnalyzeResult {
  success: boolean;
  uploadId?: string;
  imageKey?: string;
  metrics?: {
    faceWidth: number;
    faceHeight: number;
    faceRatio: number;
    eyeDistance: number;
    eyeWidthLeft: number;
    eyeWidthRight: number;
    noseWidth: number;
    lipWidth: number;
    faceType: string;
  };
  error?: string;
}

/**
 * Report generation result from POST /api/beauty/report
 */
export interface ReportResult {
  success: boolean;
  report?: {
    analysisId: string;
    reportLevel: string;
    title: string;
    faceSummary: { title: string; content: string[] };
    makeupStyle: { title: string; content: string[] };
    colorAdvice: { title: string; content: string[] };
    productAdvice: { title: string; content: string[] };
    beautyPlan: { title: string; content: string[] };
    createdAt: string;
  };
  reportId?: string;
  error?: string;
}

class AnalyzeService {
  /**
   * Step 1: Call POST /api/beauty/analyze with uploadId and imageKey
   * Returns face metrics from the analysis.
   */
  async analyzeImage(uploadId: string, imageKey: string): Promise<AnalyzeResult> {
    try {
      const response = await request<AnalyzeResult>("/api/beauty/analyze", "POST", {
        uploadId,
        imageKey
      });
      if (response.success && response.data) {
        return { success: true, uploadId, imageKey, metrics: response.data.metrics };
      }
      return { success: false, error: response.error || "分析失败" };
    } catch (err) {
      console.error("[AnalyzeService] analyzeImage error:", err);
      return { success: false, error: "AI分析失败，请重试" };
    }
  }

  /**
   * Step 2: Generate report via POST /api/beauty/report
   * Then query it via GET /api/beauty/report/query?id=<reportId>
   */
  async generateReport(
    analysisId: string,
    faceMetrics: any,
    reportLevel: string = "first-look"
  ): Promise<ReportResult> {
    try {
      const response = await request<ReportResult>("/api/beauty/report", "POST", {
        analysisId,
        reportLevel,
        faceMetrics
      });
      if (response.success && response.data) {
        return { success: true, report: response.data };
      }
      return { success: false, error: response.error || "报告生成失败" };
    } catch (err) {
      console.error("[AnalyzeService] generateReport error:", err);
      return { success: false, error: "报告生成失败，请重试" };
    }
  }

  /**
   * Step 3: Query the generated report via GET /api/beauty/report/query?id=<reportId>
   */
  async queryReport(reportId: string): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const response = await request<{ report: any; balance: number }>(
        "/api/beauty/report/query?id=" + encodeURIComponent(reportId),
        "GET"
      );
      if (response.success && response.data) {
        return { success: true, report: response.data.report };
      }
      return { success: false, error: response.error || "报告查询失败" };
    } catch (err) {
      console.error("[AnalyzeService] queryReport error:", err);
      return { success: false, error: "报告查询失败" };
    }
  }
}

export const analyzeService = new AnalyzeService();
export default analyzeService;
