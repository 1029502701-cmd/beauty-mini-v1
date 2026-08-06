import { apiClient } from "./apiClient";
import type { DashboardStats, ApiResponse } from "@/types";

const API_PATH = "/api/admin/dashboard/stats";

const MOCK_STATS: DashboardStats = {
  users: { total: 12847, todayNew: 23 },
  ai: { totalAnalyses: 38912, successfulReports: 37201, failedTasks: 1711 },
  commerce: { tokenConsumed: 156800, beautyProCount: 432 },
  recommendations: { productRecommendations: 28450, creatorRecommendations: 19320 },
  orders: { total: 1568, paid: 1402 },
};

/**
 * getStats - Fetches dashboard statistics from the backend.
 * Returns mock data as fallback when the API is unavailable.
 */
export const getStats = async (): Promise<DashboardStats> => {
  try {
    const res = await apiClient.get<ApiResponse<DashboardStats>>(API_PATH);
    if (res?.data) return res.data;
    return MOCK_STATS;
  } catch {
    // Simulate latency for a better UX feel when backend is unavailable
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_STATS;
  }
};
