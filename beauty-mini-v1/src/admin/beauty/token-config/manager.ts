import type { ReportLevel } from "@/types/report-level";

class TokenConfigManager {
  private config: Record<ReportLevel, number>;
  private STORAGE_KEY = "admin_token_configs";

  constructor(defaultConfig: Record<ReportLevel, number> = { "first-look": 0, "style-upgrade": 0, "beauty-pro": 1 }) {
    const stored = this.loadStoredConfig();
    this.config = stored || { ...defaultConfig };
  }

  private loadStoredConfig(): Record<ReportLevel, number> | null {
    const item = localStorage.getItem(this.STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  }

  private saveStoredConfig(config: Record<ReportLevel, number>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  getTokenCost(level: ReportLevel): number {
    return this.config[level] || 0;
  }

  updateTokenCost(level: ReportLevel, cost: number): number {
    this.config[level] = cost;
    this.saveStoredConfig(this.config);
    return cost;
  }

  getAllTokenCosts(): Readonly<Record<ReportLevel, number>> {
    return { ...this.config };
  }

  resetTokenCost(level: ReportLevel): number {
    delete this.config[level];
    this.saveStoredConfig(this.config);
    return this.getTokenCost(level);
  }
}

const tokenConfigManager = new TokenConfigManager();
export default tokenConfigManager;
export { TokenConfigManager };
