import type { ReportContentModule, ReportAccessLevel, ContentPermissionConfig, BeautyReport } from "@/types";
import contentPermissionManager from "@/admin/beauty/permission-config/manager";

export const DEFAULT_PERMISSIONS: ContentPermissionConfig = {
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

class ContentPermissionService {
  private config: ContentPermissionConfig = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));

  loadPermissions(config: ContentPermissionConfig): void {
    this.config = { ...this.config, ...config };
  }

  initFromAdmin(): void {
    const adminPerms = contentPermissionManager.getAllPermissions();
    if (adminPerms) {
      this.config = {} as ContentPermissionConfig;
      for (const level of Object.keys(adminPerms) as ReportAccessLevel[]) {
        this.config[level] = { ...adminPerms[level] };
      }
      for (const level of ["first-look", "style-upgrade", "beauty-pro"] as ReportAccessLevel[]) {
        if (!this.config[level]) {
          this.config[level] = { ...DEFAULT_PERMISSIONS[level] };
        } else {
          const modules: ReportContentModule[] = ["faceAnalysis","makeupStyle","colorAnalysis","makeupSuggestion","productRecommendation","kolRecommendation","beautyPlan"];
          for (const module of modules) {
            if (this.config[level][module] === undefined) {
              this.config[level][module] = DEFAULT_PERMISSIONS[level][module] || false;
            }
          }
        }
      }
    } else {
      this.config = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    }
  }

  getPermissions(level: ReportAccessLevel): Record<ReportContentModule, boolean> {
    const levelPerms = this.config[level] || this.config["first-look"];
    const modules: ReportContentModule[] = ["faceAnalysis", "makeupStyle", "colorAnalysis", "makeupSuggestion", "productRecommendation", "kolRecommendation", "beautyPlan"];
    const result: Record<ReportContentModule, boolean> = {} as Record<ReportContentModule, boolean>;
    for (const module of modules) {
      result[module] = levelPerms[module] !== undefined ? levelPerms[module] : false;
    }
    return result;
  }

  isModuleEnabled(level: ReportAccessLevel, module: ReportContentModule): boolean {
    const perms = this.getPermissions(level);
    return !!perms[module];
  }

  filterReport(report: BeautyReport, level: ReportAccessLevel): BeautyReport {
    const perms = this.getPermissions(level);
    const filtered = { ...report };
    if (!perms.faceAnalysis) {
      (filtered as any).analysis = { ...(filtered.analysis || {}), suggestions: [], facialFeatures: {} };
    }
    if (!perms.makeupStyle) {
      (filtered as any).makeup = { recommendations: [] };
    }
    if (!perms.colorAnalysis) {
      (filtered as any).colors = { recommendedColors: [] };
    }
    if (!perms.makeupSuggestion) {
      (filtered as any).analysis = { ...(filtered.analysis || {}), suggestions: [] };
    }
    if (!perms.productRecommendation) {
      filtered.products = [];
      if (filtered.analysis) {
        (filtered.analysis).productRecommendations = [];
      }
    }
    if (!perms.kolRecommendation) {
      filtered.bloggers = [];
      if (filtered.analysis) {
        (filtered.analysis).kolRecommendations = [];
      }
    }
    if (!perms.beautyPlan) {
      delete (filtered as any).beautyPlan;
    }
    return filtered;
  }

  getConfig(): ContentPermissionConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}

export const contentPermissionService = new ContentPermissionService();
contentPermissionService.initFromAdmin();
export default contentPermissionService;
