// Unified Admin Configuration Service for Beauty Mini Program
// Prioritizes admin-configured values over defaults

import reportLevelManager from "./report-config/manager";
import contentPermissionManager from "./permission-config/manager";
import tokenConfigManager from "./token-config/manager";
import recommendationConfig from "./recommendation-config/config";

import type { 
  ReportLevel, 
  ReportLevelConfig, 
  ReportAccessLevel, 
  ReportContentModule,
  ContentPermissionConfig
} from "@/types";
import { REPORT_LEVELS } from "@/types/report-level";
import { DEFAULT_PERMISSIONS } from "@/services/content-permission";

/**
 * BeautyConfigService - Single source of truth for all beauty-related configurations
 * All services and pages should query configuration through this service instead of
 * directly accessing REPORT_LEVELS or hardcoding permission values.
 */
class BeautyConfigService {
  // Get report level configuration (admin config or default)
  getReportLevelConfig(level: ReportLevel): ReportLevelConfig | undefined {
    const adminConfig = reportLevelManager.getLevel(level);
    if (adminConfig) return adminConfig;
    return REPORT_LEVELS[level];
  }

  // Get all report level configurations (admin config or default)
  getAllReportLevels(): Readonly<Record<ReportLevel, ReportLevelConfig>> {
    const adminConfigs = reportLevelManager.getAllLevels();
    // Merge: admin overrides default, but missing levels fall back to default
    const result: Record<ReportLevel, ReportLevelConfig> = {};
    for (const level of Object.keys(REPORT_LEVELS) as ReportLevel[]) {
      result[level] = adminConfigs[level] ? { ...adminConfigs[level] } : { ...REPORT_LEVELS[level] };
    }
    return result;
  }

  // Get token cost for a level (admin config or default)
  getTokenCost(level: ReportLevel): number {
    const cost = tokenConfigManager.getTokenCost(level);
    if (cost !== 0 || level === "beauty-pro") {
      // For beauty-pro, use admin cost if set, otherwise default from REPORT_LEVELS
      if (level === "beauty-pro" && cost === 0) {
        return REPORT_LEVELS[level].tokenCost;
      }
      return cost;
    }
    // Fall back to default for free levels
    return REPORT_LEVELS[level]?.tokenCost || 0;
  }

  // Get expiration days for a level
  getExpireDays(level: ReportLevel): number {
    const adminConfig = reportLevelManager.getLevel(level);
    if (adminConfig) return adminConfig.expireDays;
    return REPORT_LEVELS[level].expireDays;
  }

  // Get price for a level (in cents)
  getPrice(level: ReportLevel): number {
    const adminConfig = reportLevelManager.getLevel(level);
    if (adminConfig) return adminConfig.price;
    return REPORT_LEVELS[level].price;
  }

  // Check if a level is enabled
  isLevelEnabled(level: ReportLevel): boolean {
    const adminConfig = reportLevelManager.getLevel(level);
    if (adminConfig !== undefined) return adminConfig.enabled;
    return REPORT_LEVELS[level].enabled;
  }

  // Get content permissions for a level (admin config or default)
  getContentPermissions(level: ReportAccessLevel): Record<ReportContentModule, boolean> {
    const adminPerms = contentPermissionManager.getPermissions(level);
    if (adminPerms) return adminPerms;
    // Fall back to default with all modules present
    const defaultPerms = DEFAULT_PERMISSIONS[level] || DEFAULT_PERMISSIONS["first-look"];
    const modules: ReportContentModule[] = [
      "faceAnalysis", "makeupStyle", "colorAnalysis", "makeupSuggestion",
      "productRecommendation", "kolRecommendation", "beautyPlan"
    ];
    const result: Record<ReportContentModule, boolean> = {};
    for (const module of modules) {
      result[module] = defaultPerms[module] !== undefined ? defaultPerms[module] : false;
    }
    return result;
  }

  // Get whether a specific module is enabled at the admin override level
  // This checks both ContentPermission AND Recommendation toggles
  isModuleVisible(level: ReportAccessLevel, module: ReportContentModule): boolean {
    const permEnabled = this.getContentPermissions(level)[module];
    if (!permEnabled) return false;
    
    // For recommendation modules, also check the recommendation toggle
    if (module === "productRecommendation" || module === "kolRecommendation") {
      return recommendationConfig.isEnabled(module);
    }
    
    return true;
  }

  // Get recommendation module visibility state
  isRecommendationEnabled(module: ReportContentModule): boolean {
    return recommendationConfig.isEnabled(module);
  }

  // Get all configuration as a structured object
  getConfig() {
    return {
      levels: this.getAllReportLevels(),
      tokenCosts: tokenConfigManager.getAllTokenCosts(),
      permissions: contentPermissionManager.getAllPermissions(),
      recommendations: recommendationConfig.getAll()
    };
  }
}

// Singleton instance
const beautyConfigService = new BeautyConfigService();

export default beautyConfigService;
export { BeautyConfigService };
