import type { ReportLevel, ReportLevelConfig } from "@/types/report-level";
import { REPORT_LEVELS } from "@/types/report-level";

/**
 * ReportLevelManager - Manages report level configurations with admin override capability
 * Supports CRUD operations for report level configurations.
 */
class ReportLevelManager {
  private config: Record<ReportLevel, ReportLevelConfig>;
  private STORAGE_KEY = "admin_report_level_configs";

  constructor(defaultConfig: Record<ReportLevel, ReportLevelConfig> = REPORT_LEVELS) {
    const stored = this.loadStoredConfig();
    this.config = stored || { ...defaultConfig };
  }

  // Load stored admin config from localStorage
  private loadStoredConfig(): Record<ReportLevel, ReportLevelConfig> | null {
    const item = localStorage.getItem(this.STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  }

  // Save admin config to localStorage
  private saveStoredConfig(config: Record<ReportLevel, ReportLevelConfig>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  // Get all report levels with their configurations
  getAllLevels(): Readonly<Record<ReportLevel, ReportLevelConfig>> {
    return { ...this.config };
  }

  // Get a specific level configuration
  getLevel(level: ReportLevel): ReportLevelConfig | undefined {
    return this.config[level];
  }

  // Update a level configuration (admin operation)
  updateLevel(level: Partial<ReportLevelConfig>): ReportLevelConfig | undefined {
    const levelId = level.level || (level.id as ReportLevel);
    if (!this.config[levelId]) {
      return undefined;
    }
    this.config[levelId] = { ...this.config[levelId], ...level };
    this.saveStoredConfig(this.config);
    return this.config[levelId];
  }

  // Enable a level
  enableLevel(level: ReportLevel): ReportLevelConfig | undefined {
    const config = this.config[level];
    if (config) {
      config.enabled = true;
      this.saveStoredConfig(this.config);
    }
    return config;
  }

  // Disable a level
  disableLevel(level: ReportLevel): ReportLevelConfig | undefined {
    const config = this.config[level];
    if (config) {
      config.enabled = false;
      this.saveStoredConfig(this.config);
    }
    return config;
  }

  // Check if level exists
  hasLevel(level: ReportLevel): boolean {
    return !!this.config[level];
  }
}

// Singleton instance
const reportLevelManager = new ReportLevelManager();

export default reportLevelManager;
export { ReportLevelManager };
