/**
 * Permission Service - Handles report access via beauty-api-pages backend.
 * Uses server API for balance checks (source of truth).
 */
import type { BeautyReport, ReportAccess, ReportLevel } from "@/types";
import { REPORT_LEVELS } from "@/types/report-level";
import { getStorage, setStorage } from "@/utils/storage";
import userService from "./user-service";
import { request } from "@/services/api";
import { fetchServerBalance } from "@/services/token";

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
    const accessRecords = this.getStoredAccess();
    return accessRecords.some(r => r.reportId === reportId && r.unlocked && r.userId === user);
  }

  isReportUnlocked(reportId: string, userId?: string): boolean {
    const user = userId || "unknown";
    const records = this.getStoredAccess();
    return records.some(r => r.reportId === reportId && r.unlocked && r.userId === user);
  }

  async getAvailableLevel(userId?: string): Promise<ReportLevel> {
    const user = userId || await this.getCurrentUserId();
    try {
      const balanceResult = await fetchServerBalance(user);
      if (balanceResult.success && balanceResult.balance !== undefined) {
        const balance = balanceResult.balance;
        const levels: ReportLevel[] = ["first-look", "style-upgrade", "beauty-pro"];
        for (let j = levels.length - 1; j >= 0; j--) {
          const cost = REPORT_LEVELS[levels[j]].tokenCost;
          if (cost === 0 || balance >= cost) return levels[j];
        }
        return "first-look";
      }
    } catch {
      // fall through
    }
    const { getAvailableCredits } = require("@/services/token");
    const quotas = getAvailableCredits(user);
    const levels: ReportLevel[] = ["first-look", "style-upgrade", "beauty-pro"];
    for (let j = levels.length - 1; j >= 0; j--) {
      const cost = REPORT_LEVELS[levels[j]].tokenCost;
      if (cost === 0 || quotas.tokenCount >= cost) return levels[j];
    }
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
        reportId, userId: user, level, unlocked: true,
        unlockType: "free", tokenCost: 0,
        createdAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + config.expireDays * 24 * 60 * 60 * 1000).toISOString()
      };
      const records = this.getStoredAccess();
      records.push(access);
      this.setStoredAccess(records);
      return { success: true, message: level + " 等级已解锁" };
    }
    try {
      const accessRes = await request<{ success: boolean; allowed: boolean; tokenRequired: number; balance: number }>(
        "/api/beauty/access?reportLevel=" + encodeURIComponent(level), "GET"
      );
      if (accessRes.success && accessRes.data && accessRes.data.allowed) {
        const access: ReportAccess = {
          reportId, userId: user, level, unlocked: true,
          unlockType: "token", tokenCost: config.tokenCost,
          createdAt: new Date().toISOString(),
          expireAt: new Date(Date.now() + config.expireDays * 24 * 60 * 60 * 1000).toISOString()
        };
        const records = this.getStoredAccess();
        records.push(access);
        this.setStoredAccess(records);
        return { success: true, message: level + " 等级已解锁" };
      }
    } catch { /* fall through */ }
    return { success: false, message: "Token不足：需要 " + config.tokenCost + " 个Token，当前余额不足" };
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