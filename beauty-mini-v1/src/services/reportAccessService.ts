/**
 * Report Access Service
 * Checks whether a user has access to each report level and manages unlock state.
 */
import type { ReportLevel, ReportAccess, UserTokenBalance, TokenBalanceResult } from "@/types";
import { REPORT_LEVELS } from "@/types/report-level";
import { getStorage, setStorage } from "@/utils/storage";
import userService from "@/services/user-service";
import { fetchServerBalance, consumeServerTokens } from "@/services/token";

export type AccessStatus = "locked" | "unlocked";

export interface ReportAccessCheck {
  level: ReportLevel;
  status: AccessStatus;
  tokenCost: number;
  isFree: boolean;
  reportId?: string;
}

export interface UnlockResult {
  success: boolean;
  message: string;
  balanceAfter?: number;
  reportId?: string;
}

const ACCESS_RECORDS_KEY = "report_access_records";

class ReportAccessService {
  private getStoredAccess(): ReportAccess[] {
    return getStorage<ReportAccess[]>(ACCESS_RECORDS_KEY, []) ?? [];
  }

  private setStoredAccess(records: ReportAccess[]): void {
    setStorage(ACCESS_RECORDS_KEY, records);
  }

  async getCurrentUserId(): Promise<string> {
    try {
      const user = await userService.getCurrentUser();
      return user.userId;
    } catch {
      return "guest_" + Date.now();
    }
  }

  async checkAccess(
    reportId: string,
    userId?: string
  ): Promise<ReportAccessCheck[]> {
    const user = userId || await this.getCurrentUserId();
    const records = this.getStoredAccess();
    const unlockedMap = new Map<string, ReportAccess>();
    for (const r of records) {
      if (r.userId === user && r.unlocked && r.reportId === reportId) {
        unlockedMap.set(r.level, r);
      }
    }
    const balanceResult = await fetchServerBalance(user);
    const balance = balanceResult.success ? balanceResult.balance ?? 0 : 0;
    const levels: ReportLevel[] = ["first-look", "style-upgrade", "beauty-pro"];
    return levels.map((level) => {
      const config = REPORT_LEVELS[level];
      const unlocked = unlockedMap.has(level) || config.tokenCost === 0;
      return {
        level,
        status: unlocked ? "unlocked" : "locked",
        tokenCost: config.tokenCost,
        isFree: config.isFree,
        reportId,
      } as ReportAccessCheck;
    });
  }

  isLevelUnlocked(reportId: string, level: ReportLevel, userId?: string): boolean {
    const user = userId || "guest_unknown";
    return this.getStoredAccess().some(
      (r) => r.reportId === reportId && r.level === level && r.unlocked && r.userId === user
    );
  }

  async getBalance(userId?: string): Promise<UserTokenBalance> {
    const user = userId || await this.getCurrentUserId();
    const result = await fetchServerBalance(user);
    if (result.success && result.balance !== undefined) {
      return {
        userId: user,
        balance: result.balance,
        freeBalance: result.balance,
        purchasedBalance: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    const stored = getStorage<UserTokenBalance>("user_token_balance_" + user, undefined);
    return stored || {
      userId: user,
      balance: 0,
      freeBalance: 1,
      purchasedBalance: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async unlockReport(
    reportId: string,
    level: ReportLevel,
    userId?: string
  ): Promise<UnlockResult> {
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
        expireAt: new Date(Date.now() + config.expireDays * 24 * 60 * 60 * 1000).toISOString(),
      };
      const records = this.getStoredAccess();
      records.push(access);
      this.setStoredAccess(records);
      return { success: true, message: level + " 已解锁", reportId };
    }
    const balanceResult = await fetchServerBalance(user);
    if (!balanceResult.success || balanceResult.balance === undefined) {
      return { success: false, message: balanceResult.error || "获取余额失败" };
    }
    if (balanceResult.balance < config.tokenCost) {
      return {
        success: false,
        message: "余额不足：需要 " + config.tokenCost + " 个 Token，当前余额 " + balanceResult.balance,
        balanceAfter: balanceResult.balance,
      };
    }
    const { consumeServerTokens } = await import("@/services/token");
    const consumeResult = await consumeServerTokens(config.tokenCost, "Unlock " + level + " report");
    if (!consumeResult.success) {
      return { success: false, message: consumeResult.error || "扣减失败" };
    }
    const access: ReportAccess = {
      reportId,
      userId: user,
      level,
      unlocked: true,
      unlockType: "token",
      tokenCost: config.tokenCost,
      createdAt: new Date().toISOString(),
      expireAt: new Date(Date.now() + config.expireDays * 24 * 60 * 60 * 1000).toISOString(),
    };
    const records = this.getStoredAccess();
    records.push(access);
    this.setStoredAccess(records);
    return {
      success: true,
      message: level + " 已解锁",
      balanceAfter: consumeResult.balance,
      reportId,
    };
  }

  async getUserUnlockedLevels(userId?: string): Promise<ReportLevel[]> {
    const user = userId || await this.getCurrentUserId();
    const now = new Date();
    return this.getStoredAccess()
      .filter(
        (r) => r.userId === user && r.unlocked && new Date(r.expireAt) > now
      )
      .map((r) => r.level);
  }

  async getAccessStatusForReport(
    reportId: string,
    userId?: string
  ): Promise<Record<ReportLevel, AccessStatus>> {
    const user = userId || await this.getCurrentUserId();
    const now = new Date();
    const unlockedLevels = this.getStoredAccess()
      .filter(
        (r) => r.reportId === reportId && r.userId === user && r.unlocked && new Date(r.expireAt) > now
      )
      .map((r) => r.level);
    const result: Record<ReportLevel, AccessStatus> = {
      "first-look": "unlocked",
      "style-upgrade": "locked",
      "beauty-pro": "locked",
    };
    for (const level of unlockedLevels) {
      result[level] = "unlocked";
    }
    return result;
  }
}

const reportAccessService = new ReportAccessService();
export default reportAccessService;
export { ReportAccessService };
