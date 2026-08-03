import type { ReportAccessLevel, ReportContentModule, ContentPermissionConfig } from "@/types";

// Default permission configuration (kept in sync with content-permission.ts)
const DEFAULT_PERMISSIONS: ContentPermissionConfig = {
  "first-look": {
    faceAnalysis: true,
    makeupStyle: true,
    colorAnalysis: false,
    makeupSuggestion: false,
    productRecommendation: false,
    kolRecommendation: false,
    beautyPlan: false
  },
  "style-upgrade": {
    faceAnalysis: true,
    makeupStyle: true,
    colorAnalysis: true,
    makeupSuggestion: true,
    productRecommendation: true,
    kolRecommendation: true,
    beautyPlan: false
  },
  "beauty-pro": {
    faceAnalysis: true,
    makeupStyle: true,
    colorAnalysis: true,
    makeupSuggestion: true,
    productRecommendation: true,
    kolRecommendation: true,
    beautyPlan: true
  }
};

class ContentPermissionManager {
  private config: ContentPermissionConfig;
  private STORAGE_KEY = "admin_permission_configs";
  private readonly MODULES: ReportContentModule[] = [
    "faceAnalysis",
    "makeupStyle",
    "colorAnalysis",
    "makeupSuggestion",
    "productRecommendation",
    "kolRecommendation",
    "beautyPlan"
  ];

  constructor(defaultConfig: ContentPermissionConfig = DEFAULT_PERMISSIONS) {
    const stored = this.loadStoredConfig();
    this.config = stored || { ...defaultConfig };
  }

  // Load stored admin config from localStorage
  private loadStoredConfig(): ContentPermissionConfig | null {
    const item = localStorage.getItem(this.STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  }

  // Save admin config to localStorage
  private saveStoredConfig(config: ContentPermissionConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  // Get all permission configurations
  getAllPermissions(): Readonly<ContentPermissionConfig> {
    return { ...this.config };
  }

  // Get permissions for a specific level
  getPermissions(level: ReportAccessLevel): Record<ReportContentModule, boolean> | undefined {
    const levelPerms = this.config[level];
    if (!levelPerms) return undefined;
    // Ensure all modules are present
    const result: Record<ReportContentModule, boolean> = {};
    for (const module of this.MODULES) {
      result[module] = levelPerms[module] !== undefined ? levelPerms[module] : false;
    }
    return result;
  }

  // Enable/disable a specific module for a level
  setModulePermission(level: ReportAccessLevel, module: ReportContentModule, enabled: boolean): boolean {
    if (!this.config[level]) {
      this.config[level] = {};
    }
    this.config[level][module] = enabled;
    this.saveStoredConfig(this.config);
    return true;
  }

  // Set all permissions for a level at once
  setLevelPermissions(level: ReportAccessLevel, perms: Record<ReportContentModule, boolean>): boolean {
    if (!this.config[level]) {
      this.config[level] = {};
    }
    // Copy only known modules
    for (const module of this.MODULES) {
      this.config[level][module] = perms[module] !== undefined ? perms[module] : false;
    }
    this.saveStoredConfig(this.config);
    return true;
  }

  // Reset a level to default permissions
  resetLevelToDefault(level: ReportAccessLevel): boolean {
    if (!this.config[level]) {
      return true;
    }
    // Delete all modules for this level - they will fall back to DEFAULT_PERMISSIONS
    for (const module of this.MODULES) {
      delete this.config[level][module];
    }
    this.saveStoredConfig(this.config);
    return true;
  }

  // Check if level has custom permissions (different from default)
  hasCustomPermissions(level: ReportAccessLevel): boolean {
    const defaultPerms = DEFAULT_PERMISSIONS[level];
    const currentPerms = this.config[level];
    if (!currentPerms) return false;
    for (const module of this.MODULES) {
      const defaultVal = defaultPerms[module] !== undefined ? defaultPerms[module] : false;
      if (currentPerms[module] !== defaultVal) {
        return true;
      }
    }
    return false;
  }
}

// Singleton instance
const contentPermissionManager = new ContentPermissionManager();

export default contentPermissionManager;
export { ContentPermissionManager };
