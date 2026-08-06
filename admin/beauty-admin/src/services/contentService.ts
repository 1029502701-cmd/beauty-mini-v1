import { apiClient, callOrFallback } from "./apiClient";
import type { ContentItem, ContentFilter, PaginatedResult, ApiResponse } from "@/types";

const API_PATH = "/api/admin/content";

const MOCK_CONTENT: ContentItem[] = [
  { id: "ct001", title: "2026夏季必备底妆技巧", type: "article", thumbnail: "", url: "https://example.com/ct1", platform: "小红书", views: 12500, likes: 890, comments: 45, shares: 120, status: "published", createdAt: "2026-07-01T08:00:00Z", updatedAt: "2026-07-15T10:00:00Z" },
  { id: "ct002", title: "新手化妆全套视频教程", type: "video", thumbnail: "", url: "https://example.com/ct2", platform: "B站", views: 56000, likes: 3200, comments: 210, shares: 450, status: "published", createdAt: "2026-06-20T08:00:00Z", updatedAt: "2026-06-20T08:00:00Z" },
  { id: "ct003", title: "七夕妆容灵感图片集", type: "image", thumbnail: "", url: "https://example.com/ct3", platform: "小红书", views: 8900, likes: 560, comments: 28, shares: 85, status: "published", createdAt: "2026-07-20T08:00:00Z", updatedAt: "2026-07-20T08:00:00Z" },
  { id: "ct004", title: "秋冬热门色号盘点（草稿）", type: "article", thumbnail: "", url: "", platform: "公众号", views: 0, likes: 0, comments: 0, shares: 0, status: "draft", createdAt: "2026-07-28T08:00:00Z", updatedAt: "2026-07-28T08:00:00Z" },
  { id: "ct005", title: "2025年夏季回顾", type: "carousel", thumbnail: "", url: "https://example.com/ct5", platform: "小红书", views: 3400, likes: 210, comments: 15, shares: 30, status: "archived", createdAt: "2025-08-01T08:00:00Z", updatedAt: "2026-01-01T08:00:00Z" },
];

export const fetchContent = async (filter: ContentFilter = {}): Promise<PaginatedResult<ContentItem>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set("keyword", filter.keyword);
  if (filter.type) params.set("type", filter.type);
  if (filter.status) params.set("status", filter.status);
  if (filter.platform) params.set("platform", filter.platform);
  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: ContentItem[]; total: number; page: number; pageSize: number; totalPages: number }>>(`${API_PATH}?${params.toString()}`),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<ContentItem>;
    throw new Error("no data");
  }).catch(() => fallbackMockContent(filter));
};

export const updateContentStatus = async (id: string, status: ContentItem["status"]): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(id)}/status`, { status }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

async function fallbackMockContent(filter: ContentFilter = {}): Promise<PaginatedResult<ContentItem>> {
  let items = [...MOCK_CONTENT];
  if (filter.keyword) items = items.filter((c) => c.title.includes(filter.keyword!));
  if (filter.type) items = items.filter((c) => c.type === filter.type);
  if (filter.status) items = items.filter((c) => c.status === filter.status);
  if (filter.platform) items = items.filter((c) => c.platform === filter.platform);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
