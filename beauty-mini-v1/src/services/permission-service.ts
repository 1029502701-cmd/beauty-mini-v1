/**
 * Permission Service - Handles report access via beauty-api-pages backend.
 *
 * Uses:
 *   GET /api/beauty/access?reportLevel=<level>  - check if user can access report level
 *   Local token management for free-tier grants
 */
import type { BeautyReport, ReportAccess, ReportLevel } from "@/types";
import { REPORT_LEVELS } from "@/types/report-level";
import { getStorage, setStorage } from "@/utils/storage";
import userService from "./user-service";
import { request } from "@/services/api";

class ReportPermissionService {
  private readonly STORAGE_KEY = "report_access_records";

  private getStoredAccess(): ReportAccess[] {
    return getStorage<ReportAccess[]>(this.STORAGE_KEY, []) ?? [];
  }

  private setStoredAccess(records: ReportAccess[]): void {
    setStorage(this.STORAGE_KEY, records);
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await userService.getCurrentUser();
      return user.userId;
    } catch {
      return "user_" + Date.now();
    }
  }

  /**
   * Check access via backend: GET /api/beauty/access?reportLevel=<level>
   * Falls back to local check if backend unavailable.
   */
  async hasAccess(reportId: string, userId?: string, level: ReportLevel = "first-look"): Promise<boolean> {
    const user = userId || await this.getCurrentUserId();

    try {
      const response = await request<{ success: boolean; allowed: boolean; tokenRequired: number; balance: number }>(
        "/api/beauty/access?reportLevel=" + encodeURIComponent(level),
        "GET"
      );
      if (response.success && response.data) {
        return response.data.allowed;
      }
    } catch {
      console.warn("[PermissionService] Backend access check failed, using local fallback");
    }

    // Local fallback
    const accessRecords = this.getStoredAccess();
    return accessRecords.some(r => r.reportId === reportId && r.unlocked && r.userId === user);
  }

  isReportUnlocked(reportId: string, userId?: string): boolean {
    const user = userId || "unknown";
    const records = this.getStoredAccess();
    return records.some(r => r.reportId === reportId && r.unlocked && r.userId === user);
  }

  getAvailableLevel(userId: string): ReportLevel {
    const quotas = require("./token").default.getAvailableCredits(userId);
    if (quotas.tokenCount >= 3) return "beauty-pro";
    if (quotas.tokenCount >= 1 || quotas.freeCount > 0) return "style-upgrade";
    return "first-look";
  }

  async unlockReport(reportId: string, level: ReportLevel, userId?: string): Promise<{ success: boolean; message: string }> {
    const user = userId || await this.getCurrentUserId();
    const config = REPORT_LEVELS[level];
    if (!config || !config.enabled) {
      return { success: false, message: "报告等级不存在或已停用" };
    }

    if (config.isFree) {
      const access: ReportAccess = {
        reportId,
        userId: user,
        level,
        unlocked: true,
        unlockType: "free",
        tokenCost: 0,
        createdAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + config.expireDays * 24 * 60 * 60 * 1000).toISOString()
      };
      const records = this.getStoredAccess();
      records.push(access);
      this.setStoredAccess(records);
      return { success: true, message: level + " 等级已解锁" };
    }

    // beauty-pro requires token consumption — check via backend
    try {
      const accessRes = await request<{ success: boolean; allowed: boolean; tokenRequired: number; balance: number }>(
        "/api/beauty/access?reportLevel=beauty-pro",
        "GET"
      );
      if (accessRes.success && accessRes.data && accessRes.data.allowed) {
        const access: ReportAccess = {
          reportId,
          userId: user,
          level,
          unlocked: true,
          unlockType: "token",
          tokenCost: config.tokenCost,
          createdAt: new Date().toISOString(),
          expireAt: new Date(Date.now() + config.expireDays * 24 * 60 * 60 * 1000).toISOString()
        };
        const records = this.getStoredAccess();
        records.push(access);
        this.setStoredAccess(records);
        return { success: true, message: "beauty-pro 等级已解锁" };
      }
    } catch {
      // fall through to local
    }

    return { success: false, message: "Token不足：需要" + config.tokenCost + "个Token，当前余额不足" };
  }

  async getReportContent(report: BeautyReport, userId?: string): Promise<BeautyReport> {
    return report;
  }

  getActiveReportLevels(userId?: string): ReportAccess[] {
    const user = userId || "unknown";
    const now = new Date();
    return this.getStoredAccess().filter(r => r.userId === user && r.unlocked && new Date(r.expireAt) > now);
  }
}

const permissionService = new ReportPermissionService();
export default permissionService;
