/**
 * Beauty Commerce Configuration Service
 * Manages beauty-related configuration settings for commerce features
 * Uses universal storage layer (wx.storage / localStorage)
 */
import { getStorage, setStorage } from "@/utils/storage";

interface BeautyConfig {
  firstLookFree: boolean;
  styleUpgradeToken: number;
  beautyProPrice: number;
}

function getStoredConfig(): BeautyConfig | null {
  return getStorage<BeautyConfig>("beauty_config", null);
}

function setStoredConfig(config: BeautyConfig): void {
  setStorage("beauty_config", config);
}

const DEFAULT_CONFIG: BeautyConfig = {
  firstLookFree: true,
  styleUpgradeToken: 1,
  beautyProPrice: 600
};

export function initConfig(): BeautyConfig {
  let config = getStoredConfig();
  if (!config) {
    config = { ...DEFAULT_CONFIG };
    setStoredConfig(config);
  }
  return config;
}

export const beautyConfig = initConfig();

export type { BeautyConfig };

export function updateConfig(updates: Partial<BeautyConfig>): BeautyConfig {
  const config = getStoredConfig() || { ...DEFAULT_CONFIG };
  const newConfig = { ...config, ...updates };
  setStoredConfig(newConfig);
  return newConfig;
}

export function getBeautyProPriceYuan(): number {
  return beautyConfig.beautyProPrice / 100;
}
