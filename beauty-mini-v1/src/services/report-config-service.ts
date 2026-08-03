import type { ReportLevel, ReportLevelConfig } from "@/types/report-level";
import reportLevelManager from "@/admin/beauty/report-config/manager";

/**
 * ReportConfigService - Centralized report level configuration management
 * All business logic should query configuration through this service instead of hardcoding.
 * Uses admin-configurable backend via ReportLevelManager as source of truth.
 */
class ReportConfigService {
  private readonly config = reportLevelManager;

  // Get all enabled report levels
  getReportLevels(): ReportLevelConfig[] {
    return Object.values(this.config.getAllLevels()).filter(cfg => cfg.enabled);
  }

  // Get configuration for a specific level
  getLevelConfig(level: ReportLevel): ReportLevelConfig | undefined {
    return this.config.getLevel(level);
  }

  // Check if a level is enabled
  isLevelEnabled(level: ReportLevel): boolean {
    return this.config.isLevelEnabled(level);
  }

  // Get token cost for a level (centralized source)
  getTokenCost(level: ReportLevel): number {
    return this.config.getTokenCost(level);
  }

  // Get expiration days for a level
  getExpireDays(level: ReportLevel): number {
    return this.config.getExpireDays(level);
  }

  // Get price for a level (in cents)
  getPrice(level: ReportLevel): number {
    return this.config.getPrice(level);
  }
}

// Singleton instance
const reportConfigService = new ReportConfigService();

export default reportConfigService;
export { ReportConfigService };
