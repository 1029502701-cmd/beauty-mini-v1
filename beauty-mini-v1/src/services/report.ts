/**
 * Report Service
 * Uses the beauty-api-pages backend for analysis and report generation.
 */
import type { BeautyReport, ReportLevel } from "@/types";
import { request } from "@/services/api";

class ReportService {
  async createAndQueryReport(
    uploadId: string,
    imageKey: string,
    reportLevel: ReportLevel = "first-look"
  ): Promise<{ success: boolean; reportId?: string; report?: BeautyReport; error?: string }> {
    try {
      const analyzeRes = await request<Record<string, unknown>>(
        "/api/beauty/analyze",
        "POST",
        { uploadId, imageKey }
      );
      if (!analyzeRes.success || !analyzeRes.data) {
        return { success: false, error: analyzeRes.error || "分析失败" };
      }
      const { metrics, imageKey: resolvedKey } = analyzeRes.data as { metrics?: unknown; imageKey?: string };

      const reportRes = await request<{ report?: Record<string, unknown>; reportId?: string }>(
        "/api/beauty/report",
        "POST",
        { analysisId: uploadId, reportLevel, faceMetrics: metrics }
      );
      if (!reportRes.success || !reportRes.data) {
        return { success: false, error: reportRes.error || "报告生成失败" };
      }

      const reportId = (reportRes.data.report as Record<string, unknown>)?.analysisId as string || uploadId;
      const queryRes = await this.queryReport(reportId);
      if (queryRes.success) {
        return { success: true, reportId, report: queryRes.report as BeautyReport };
      }
      return { success: true, reportId, report: reportRes.data.report as unknown as BeautyReport };
    } catch (err) {
      console.error("[ReportService] createAndQueryReport error:", err);
      return { success: false, error: "报告生成失败，请重试" };
    }
  }

  async queryReport(reportId: string): Promise<{ success: boolean; report?: BeautyReport; error?: string }> {
    try {
      const response = await request<{ report: unknown; balance: number }>(
        "/api/beauty/report/query?id=" + encodeURIComponent(reportId),
        "GET"
      );
      if (response.success && response.data) {
        const raw = response.data.report as Record<string, unknown>;
        const reportLevel = (raw.level as ReportLevel) || "first-look";
        const { level: _ignored, ...rest } = raw as Record<string, unknown>;
        const report: BeautyReport = {
          level: reportLevel,
          ...(_ignored as unknown as Partial<BeautyReport>),
          ...(rest as Partial<BeautyReport>)
        } as BeautyReport;
        return { success: true, report };
      }
      return { success: false, error: response.error || "报告查询失败" };
    } catch {
      return { success: false, error: "报告查询失败" };
    }
  }

  async getRecommendations(params: {
    faceType: string;
    skinType: string;
    makeupStyle: string;
    userPreference?: string;
  }): Promise<{ success: boolean; products?: Array<Record<string, unknown>>; creators?: Array<Record<string, unknown>>; error?: string }> {
    try {
      const response = await request<{ products: unknown[]; creators: unknown[] }>(
        "/api/beauty/recommend?faceType=" + encodeURIComponent(params.faceType)
          + "&skinType=" + encodeURIComponent(params.skinType)
          + "&makeupStyle=" + encodeURIComponent(params.makeupStyle)
          + (params.userPreference ? "&userPreference=" + encodeURIComponent(params.userPreference) : ""),
        "GET"
      );
      if (response.success && response.data) {
        return { success: true, products: response.data.products as Array<Record<string, unknown>>, creators: response.data.creators as Array<Record<string, unknown>> };
      }
      return { success: false, error: response.error || "推荐查询失败" };
    } catch {
      return { success: false, error: "推荐查询失败" };
    }
  }
}

const reportService = new ReportService();
export default reportService;
export { reportService };
