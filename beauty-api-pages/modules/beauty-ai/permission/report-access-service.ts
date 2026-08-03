import type { Env } from '../../functions/types';
import type { ReportLevel, PermissionResult } from './types';
import { TOKEN_COST, REPORT_TTL_DAYS } from './permission-service';

export interface ReportAccessResult {
  unlocked: boolean;
  level: ReportLevel;
  tokenCost: number;
  unlockType: 'free' | 'token';
  unlockedAt: string;
  expireAt: string;
}

export interface GrantAccessResult {
  success: boolean;
  alreadyUnlocked: boolean;
  accessRecord?: ReportAccessResult;
  error?: string;
}

export class ReportAccessService {
  constructor(private db: Env['D1_DB']) {
    this.ensureTable();
  }

  private async ensureTable(): Promise<void> {
    try {
      await this.db.prepare(
        "CREATE TABLE IF NOT EXISTS report_access (" +
        "  id TEXT PRIMARY KEY," +
        "  user_id TEXT NOT NULL," +
        "  report_id TEXT NOT NULL," +
        "  level TEXT NOT NULL CHECK(level IN ('first-look', 'style-upgrade', 'beauty-pro'))," +
        "  unlock_type TEXT NOT NULL CHECK(unlock_type IN ('free', 'token'))," +
        "  token_cost INTEGER NOT NULL DEFAULT 0," +
        "  unlocked_at TEXT NOT NULL DEFAULT (datetime('now'))," +
        "  expire_at TEXT NOT NULL" +
        ")"
      ).run();
      await this.db.prepare("CREATE INDEX IF NOT EXISTS idx_ra_user_id ON report_access(user_id)").run();
      await this.db.prepare("CREATE INDEX IF NOT EXISTS idx_ra_report_id ON report_access(report_id)").run();
      await this.db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ra_user_report_level ON report_access(user_id, report_id, level)"
      ).run();
    } catch (e) {
      console.error('[ReportAccessService.ensureTable] Error:', e);
    }
  }

  async checkReportAccess(userId: string, reportId: string, level: ReportLevel): Promise<ReportAccessResult | null> {
    const row = await this.db.prepare(
      "SELECT id, user_id, report_id, level, unlock_type, token_cost, unlocked_at, expire_at FROM report_access WHERE user_id = ? AND report_id = ? AND level = ? LIMIT 1"
    ).first<any>(userId, reportId, level);
    if (!row) return null;
    return {
      unlocked: true,
      level: row.level as ReportLevel,
      tokenCost: row.token_cost,
      unlockType: row.unlock_type as 'free' | 'token',
      unlockedAt: row.unlocked_at,
      expireAt: row.expire_at,
    };
  }

  async grantReportAccess(userId: string, reportId: string, level: ReportLevel): Promise<GrantAccessResult> {
    const existing = await this.checkReportAccess(userId, reportId, level);
    if (existing) {
      return { success: true, alreadyUnlocked: true, accessRecord: existing };
    }

    const cost = TOKEN_COST[level];
    const unlockType: 'free' | 'token' = cost === 0 ? 'free' : 'token';
    const ttlDays = REPORT_TTL_DAYS[level];
    const now = new Date().toISOString();
    const expireAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      await this.db.prepare(
        "INSERT INTO report_access (id, user_id, report_id, level, unlock_type, token_cost, unlocked_at, expire_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        crypto.randomUUID(), userId, reportId, level, unlockType, cost, now, expireAt
      ).run();

      return {
        success: true,
        alreadyUnlocked: false,
        accessRecord: { unlocked: true, level, tokenCost: cost, unlockType, unlockedAt: now, expireAt },
      };
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('uq_ra_user_report_level')) {
        const retry = await this.checkReportAccess(userId, reportId, level);
        if (retry) return { success: true, alreadyUnlocked: true, accessRecord: retry };
      }
      console.error('[ReportAccessService.grantReportAccess] Error:', err);
      return { success: false, alreadyUnlocked: false, error: err.message || 'Failed to grant access' };
    }
  }

  async getUnlockedLevels(userId: string, reportId: string): Promise<ReportAccessResult[]> {
    const rows = await this.db.prepare(
      "SELECT level, unlock_type, token_cost, unlocked_at, expire_at FROM report_access WHERE user_id = ? AND report_id = ? ORDER BY level"
    ).all<any>(userId, reportId);
    return (rows.results ?? []).map((r: any) => ({
      unlocked: true,
      level: r.level as ReportLevel,
      tokenCost: r.token_cost,
      unlockType: r.unlock_type as 'free' | 'token',
      unlockedAt: r.unlocked_at,
      expireAt: r.expire_at,
    }));
  }
}