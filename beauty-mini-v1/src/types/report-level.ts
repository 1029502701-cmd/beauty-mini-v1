export type ReportLevel = "first-look" | "style-upgrade" | "beauty-pro";

// Alias used by permission-service.ts
export type ReportAccessLevel = ReportLevel;

export interface ReportLevelConfig {
  id: string;
  level: ReportLevel;
  name: string;
  icon: string;
  enabled: boolean;
  isFree: boolean;
  tokenCost: number;
  price: number;
  expireDays: number;
}

export interface ReportAccess {
  reportId: string;
  userId: string;
  level: ReportLevel;
  unlocked: boolean;
  unlockType: "free" | "token" | "future" | "payment";
  tokenCost: number;
  createdAt: string;
  expireAt: string;
}

const DEFAULT_REPORT_LEVELS: Record<ReportLevel, ReportLevelConfig> = {
  "first-look": {
    id: "level_first_look",
    level: "first-look",
    name: "初见妆容",
    icon: "??",
    enabled: true,
    isFree: true,
    tokenCost: 0,
    price: 0,
    expireDays: 7
  },
  "style-upgrade": {
    id: "level_style_upgrade",
    level: "style-upgrade",
    name: "风格进阶",
    icon: "??",
    enabled: true,
    isFree: true,
    tokenCost: 0,
    price: 0,
    expireDays: 15
  },
  "beauty-pro": {
    id: "level_beauty_pro",
    level: "beauty-pro",
    name: "专属美学",
    icon: "??",
    enabled: true,
    isFree: false,
    tokenCost: 1,
    price: 100,
    expireDays: 30
  }
};

export const REPORT_LEVELS: Readonly<Record<ReportLevel, ReportLevelConfig>> = Object.freeze(DEFAULT_REPORT_LEVELS);
