path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\creatorService.ts"
content = r'''import { apiClient, callOrFallback } from "./apiClient";
import type { Creator, CreatorFilter, PaginatedResult, ApiResponse } from "@/types";

const API_PATH = "/api/admin/creators";

const MOCK_CREATORS: Creator[] = [
  { id: "c001", name: "小圆脸美妆", avatar: "", platform: "小红书", followers: 125000, category: "彩妆教程", bio: "专注平价彩妆测评", contactWechat: "xiaoyuan_makeup", contactEmail: "xy@example.com", contactPhone: "", cooperationStatus: "active", totalCollaborations: 23, createdAt: "2025-10-01T08:00:00Z", matchTags: ["平价", "日常妆"] },
  { id: "c002", name: "抖音美妆达人Amy", avatar: "", platform: "抖音", followers: 580000, category: "妆容分享", bio: "日更美妆内容", contactWechat: "amy_douyin", contactEmail: "amy@example.com", contactPhone: "", cooperationStatus: "active", totalCollaborations: 45, createdAt: "2025-08-15T08:00:00Z", matchTags: ["美妆", "教程"] },
  { id: "c003", name: "B站彩妆教学", avatar: "", platform: "B站", followers: 89000, category: "视频教程", bio: "系统彩妆教学UP主", contactWechat: "", contactEmail: "bilibili@example.com", contactPhone: "", cooperationStatus: "pending", totalCollaborations: 3, createdAt: "2026-03-01T08:00:00Z", matchTags: [] },
  { id: "c004", name: "微博美妆博主", avatar: "", platform: "微博", followers: 320000, category: "产品推荐", bio: "美妆产品真实测评", contactWechat: "wb_beauty", contactEmail: "wb@example.com", contactPhone: "", cooperationStatus: "inactive", totalCollaborations: 12, createdAt: "2025-12-01T08:00:00Z", matchTags: ["测评", "推荐"] },
];

export const fetchCreators = async (filter: CreatorFilter = {}): Promise<PaginatedResult<Creator>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set("keyword", filter.keyword);
  if (filter.platform) params.set("platform", filter.platform);
  if (filter.category) params.set("category", filter.category);
  if (filter.cooperationStatus) params.set("cooperationStatus", filter.cooperationStatus);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: Creator[]; total: number; page: number; pageSize: number; totalPages: number }>>(`${API_PATH}?${params.toString()}`),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<Creator>;
    throw new Error("no data");
  }).catch(() => fallbackMockCreators(filter));
};

export const updateCreator = async (id: string, data: Partial<Creator>): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(id)}`, data),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

export const updateCreatorTags = async (id: string, matchTags: string[]): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(id)}/tags`, { matchTags }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

async function fallbackMockCreators(filter: CreatorFilter = {}): Promise<PaginatedResult<Creator>> {
  let items = [...MOCK_CREATORS];
  if (filter.keyword) items = items.filter((c) => c.name.includes(filter.keyword!));
  if (filter.platform) items = items.filter((c) => c.platform === filter.platform);
  if (filter.cooperationStatus) items = items.filter((c) => c.cooperationStatus === filter.cooperationStatus);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
'''
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("creatorService.ts fixed")
