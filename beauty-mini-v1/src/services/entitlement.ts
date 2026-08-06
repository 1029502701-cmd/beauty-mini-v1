/**
 * Entitlement Service - Unified access control for commercial rights
 * Uses server TokenService as source of truth for balance checks.
 */
import type { Entitlement, EntitlementSource, ReportAccessLevel } from "@/types";
import tokenService, { fetchServerBalance } from "@/services/token";
import { getStorage, setStorage } from "@/utils/storage";

const ENTITLEMENT_KEY = "beauty_entitlements";
const USER_ENTITLEMENT_CACHE = "user_entitlement_cache";

class EntitlementService {
  getEntitlements(userId: string): Entitlement[] {
    const stored = this.getStoredEntitlements();
    return stored.filter((e: Entitlement) => e.userId === userId);
  }

  hasEntitlement(userId: string, productType: "beauty_pro" | "report_unlock", reportId?: string): boolean {
    const entitlements = this.getEntitlements(userId);
    if (productType === "beauty_pro") {
      return entitlements.some(e => e.productType === "beauty_pro" && (!e.expiresAt || new Date(e.expiresAt) > new Date()));
    } else if (productType === "report_unlock") {
      if (reportId) {
        return entitlements.some(e => e.productType === "report_unlock" && e.reportId === reportId && e.unlocked);
      }
      return entitlements.some(e => e.productType === "report_unlock" && e.unlocked);
    }
    return false;
  }

  async getAvailableLevel(userId: string): Promise<ReportAccessLevel> {
    const hasBeautyPro = this.hasEntitlement(userId, "beauty_pro");
    if (hasBeautyPro) return "beauty-pro";
    const balanceResult = await fetchServerBalance(userId);
    if (balanceResult.success && balanceResult.balance !== undefined) {
      const balance = balanceResult.balance;
      if (balance >= 1) return "beauty-pro";
      if (balance >= 1) return "style-upgrade";
    }
    const quotas = tokenService.getAvailableCredits(userId);
    if (quotas.tokenCount >= 1) return "beauty-pro";
    if (quotas.tokenCount >= 1 || quotas.freeCount > 0) return "style-upgrade";
    return "first-look";
  }

  createEntitlement(params: Omit<Entitlement, "id" | "createdAt">): Entitlement {
    const isReportUnlock = params.productType === "report_unlock";
    const entitlement: Entitlement = { ...params, id: "ent_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), unlocked: isReportUnlock };
    const entitlements = this.getStoredEntitlements();
    entitlements.push(entitlement);
    this.setStoredEntitlements(entitlements);
    this.updateUserCache(params.userId, entitlement);
    return entitlement;
  }

  deleteEntitlement(entitlementId: string, userId: string): boolean {
    const entitlements = this.getStoredEntitlements();
    const idx = entitlements.findIndex((e: Entitlement) => e.id === entitlementId && e.userId === userId);
    if (idx >= 0) { entitlements.splice(idx, 1); this.setStoredEntitlements(entitlements); return true; }
    return false;
  }

  async unlockReport(reportId: string, userId: string): Promise<{ success: boolean; message: string; entitlementId?: string }> {
    const entitlements = this.getStoredEntitlements();
    const pendingUnlock = entitlements.find(e => e.productType === "report_unlock" && e.userId === userId && e.reportId === reportId && !e.unlocked);
    if (!pendingUnlock) {
      if (this.hasEntitlement(userId, "beauty_pro")) return { success: true, message: "美容 Pro 权益已解锁报告" };
      return { success: false, message: "无可用报告解锁权益或美容 Pro 权益" };
    }
    pendingUnlock.unlocked = true;
    pendingUnlock.unlockTime = new Date().toISOString();
    this.setStoredEntitlements(entitlements);
    this.updateUserCache(userId, pendingUnlock);
    return { success: true, message: "报告已解锁", entitlementId: pendingUnlock.id };
  }

  async useTokenForBeautyPro(userId: string): Promise<{ success: boolean; message: string; entitlementId?: string }> {
    if (this.hasEntitlement(userId, "beauty_pro")) return { success: false, message: "已拥有美容 Pro 权益" };
    const balanceResult = await fetchServerBalance(userId);
    if (!balanceResult.success || balanceResult.balance === undefined) return { success: false, message: balanceResult.error || "获取余额失败" };
    if (balanceResult.balance < 1) return { success: false, message: "需要至少 1 个 Token 才能兑换美容 Pro" };
    const { consumeServerTokens } = await import("@/services/token");
    const consumeResult = await consumeServerTokens(1, "Beauty Pro upgrade");
    if (!consumeResult.success) return { success: false, message: consumeResult.error || "扣除Token失败" };
    const entitlement = this.createEntitlement({ userId, productType: "beauty_pro", source: "token" as EntitlementSource, amount: 300, tokenCount: 0, paidAt: new Date().toISOString() });
    return { success: true, message: "成功使用 1 个 Token 兑换美容 Pro 权益", entitlementId: entitlement.id };
  }

  private getStoredEntitlements(): Entitlement[] { return getStorage<Entitlement[]>(ENTITLEMENT_KEY, []) ?? []; }
  private setStoredEntitlements(entitlements: Entitlement[]): void { setStorage(ENTITLEMENT_KEY, entitlements); }
  private getUserCache(userId: string): Record<string, Entitlement> { return getStorage<Record<string, Entitlement>>(USER_ENTITLEMENT_CACHE, {}) ?? {}; }
  private setUserCache(cache: Record<string, Entitlement>): void { setStorage(USER_ENTITLEMENT_CACHE, cache); }
  private updateUserCache(userId: string, entitlement: Entitlement): void { const cache = this.getUserCache(userId); cache[entitlement.id] = entitlement; this.setUserCache(cache); }
}

export const entitlementService = new EntitlementService();
export default entitlementService;