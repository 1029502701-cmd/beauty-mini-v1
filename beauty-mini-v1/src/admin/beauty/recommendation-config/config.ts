import type { ReportContentModule } from "@/types";

/**
 * RecommendationConfig - Manages recommendation module visibility toggles
 * Supports admin override to show/hide recommendation modules independently of permissions.
 */
class RecommendationConfig {
  private config: Record<ReportContentModule, boolean>;
  private STORAGE_KEY = "admin_recommendation_configs";
  private readonly RECOMMENDATION_MODULES: ReportContentModule[] = [
    "productRecommendation",
    "kolRecommendation"
  ];

  constructor(defaultConfig: Record<ReportContentModule, boolean> = { "productRecommendation": true, "kolRecommendation": true }) {
    const stored = this.loadStoredConfig();
    this.config = stored || { ...defaultConfig };
  }

  // Load stored recommendation config from localStorage
  private loadStoredConfig(): Record<ReportContentModule, boolean> | null {
    const item = localStorage.getItem(this.STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  }

  // Save recommendation config to localStorage
  private saveStoredConfig(config: Record<ReportContentModule, boolean>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  // Get the enabled state for a recommendation module
  isEnabled(module: ReportContentModule): boolean {
    return this.config[module] !== undefined ? this.config[module] : true;
  }

  // Enable/disable a recommendation module (admin operation)
  setEnabled(module: ReportContentModule, enabled: boolean): boolean {
    if (!this.RECOMMENDATION_MODULES.includes(module)) {
      return false;
    }
    this.config[module] = enabled;
    this.saveStoredConfig(this.config);
    return true;
  }

  // Get all recommendation module states
  getAll(): Readonly<Record<ReportContentModule, boolean>> {
    return { ...this.config };
  }

  // Reset a module to default
  reset(module: ReportContentModule): boolean {
    if (!this.RECOMMENDATION_MODULES.includes(module)) {
      return false;
    }
    delete this.config[module];
    this.saveStoredConfig(this.config);
    return true;
  }
}

// Singleton instance
const recommendationConfig = new RecommendationConfig();

export default recommendationConfig;
export { RecommendationConfig };
