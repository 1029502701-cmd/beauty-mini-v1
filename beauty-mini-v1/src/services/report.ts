/**
 * Report Service
 * Uses the beauty-api-pages backend:
 *   POST /api/beauty/report        - generate report
 *   GET  /api/beauty/report/query?id=<reportId> - query report
 *   GET  /api/beauty/recommend     - get product/creator recommendations
 */
import type { BeautyReport } from "@/types/beauty";
import type { ReportLevel } from "@/types/report-level";
import userService from "./user-service";
import { request } from "@/services/api";

class ReportService {
  /**
   * Full analysis flow: upload -> analyze -> generate report -> query report
   * Returns the reportId for navigation to result page.
   */
  async createAndQueryReport(
    uploadId: string,
    imageKey: string,
    reportLevel: ReportLevel = "first-look"
  ): Promise<{ success: boolean; reportId?: string; report?: any; error?: string }> {
    try {
      // Step 1: Analyze image (returns face metrics + uploadId)
      const analyzeRes = await request<any>("/api/beauty/analyze", "POST", { uploadId, imageKey });
      if (!analyzeRes.success || !analyzeRes.data) {
        return { success: false, error: analyzeRes.error || "分析失败" };
      }
      const { metrics, imageKey: resolvedKey } = analyzeRes.data;

      // Step 2: Generate report
      const reportRes = await request<any>("/api/beauty/report", "POST", {
        analysisId: uploadId,
        reportLevel,
        faceMetrics: metrics
      });
      if (!reportRes.success || !reportRes.data) {
        return { success: false, error: reportRes.error || "报告生成失败" };
      }

      // Step 3: The report is auto-saved by the backend; query it by reportId
      const reportId = reportRes.data.report?.analysisId || uploadId;
      const queryRes = await this.queryReport(reportId);
      if (queryRes.success) {
        return { success: true, reportId, report: queryRes.report };
      }
      return { success: true, reportId, report: reportRes.data.report };
    } catch (err) {
      console.error("[ReportService] createAndQueryReport error:", err);
      return { success: false, error: "报告生成失败，请重试" };
    }
  }

  /**
   * Query a previously generated report via GET /api/beauty/report/query?id=xxx
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
    } catch {
      return { success: false, error: "报告查询失败" };
    }
  }

  /**
   * Get beauty recommendations via GET /api/beauty/recommend
   */
  async getRecommendations(params: {
    faceType: string;
    skinType: string;
    makeupStyle: string;
    userPreference?: string;
  }): Promise<{ success: boolean; products?: any[]; creators?: any[]; error?: string }> {
    try {
      const response = await request<{ products: any[]; creators: any[] }>(
        "/api/beauty/recommend?faceType=" + encodeURIComponent(params.faceType)
          + "&skinType=" + encodeURIComponent(params.skinType)
          + "&makeupStyle=" + encodeURIComponent(params.makeupStyle)
          + (params.userPreference ? "&userPreference=" + encodeURIComponent(params.userPreference) : ""),
        "GET"
      );
      if (response.success && response.data) {
        return { success: true, products: response.data.products, creators: response.data.creators };
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
