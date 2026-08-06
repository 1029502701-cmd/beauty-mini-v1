import { apiClient, callOrFallback } from "./apiClient";
import type { SystemSettings, ApiResponse } from "@/types";

const API_PATH = "/api/admin/settings";

const MOCK_SETTINGS: SystemSettings = {
  aiAnalysis: {
    provider: "cloudflare-workers-ai",
    model: "media-pipe-face-mesh",
    enabled: true,
    maxConcurrency: 10,
    timeoutMs: 30000,
  },
  beautyPro: {
    enabled: true,
    trialDays: 7,
    price: 29.9,
    features: ["无限分析报告", "专属推荐", "优先客服", "高级妆容模板"],
  },
  tokenPackage: {
    defaultPackageId: "pkg002",
    autoRenewal: false,
    priceAdjustmentRatio: 1.0,
  },
  notification: {
    emailEnabled: false,
    smsEnabled: false,
    wechatEnabled: true,
  },
  platform: {
    wechatAppId: "wx1234567890abcdef",
    wechatAppSecret: "",
    domain: "https://ai-beauty.example.com",
    copyright: "© 2026 AI美妆实验室",
  },
};

export const fetchSettings = async (): Promise<SystemSettings> => {
  return callOrFallback(
    () => apiClient.get<ApiResponse<SystemSettings>>(API_PATH),
    undefined!
  ).then((res) => res?.data ?? MOCK_SETTINGS).catch(() => MOCK_SETTINGS);
};

export const updateSettings = async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
  return callOrFallback(
    () => apiClient.patch<ApiResponse<SystemSettings>>(API_PATH, settings),
    undefined!
  ).then((res) => res?.data ?? { ...MOCK_SETTINGS, ...settings }).catch(() => ({ ...MOCK_SETTINGS, ...settings }));
};
