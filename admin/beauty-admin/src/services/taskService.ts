import { apiClient, callOrFallback } from "./apiClient";
import type { AiTask, TaskFilter, PaginatedResult, ApiResponse } from "@/types";

const API_PATH = "/api/admin/tasks";

const MOCK_TASKS: AiTask[] = [
  { id: "t001", userId: "u001", userNickname: "小美", type: "analysis", status: "completed", inputUrl: "https://example.com/img1.jpg", outputUrl: "", errorMessage: undefined, createdAt: "2026-07-30T10:00:00Z", completedAt: "2026-07-30T10:00:35Z", tokenCost: 2 },
  { id: "t002", userId: "u002", userNickname: "美妆达人Lisa", type: "analysis", status: "running", inputUrl: "https://example.com/img2.jpg", createdAt: "2026-07-30T11:00:00Z", tokenCost: 2 },
  { id: "t003", userId: "u005", userNickname: "小白用户", type: "recommendation", status: "failed", inputUrl: "https://example.com/img3.jpg", errorMessage: "图片分析超时", createdAt: "2026-07-29T08:00:00Z", tokenCost: 0 },
  { id: "t004", userId: "u003", userNickname: "桃子酱", type: "analysis", status: "pending", inputUrl: "https://example.com/img4.jpg", createdAt: "2026-07-31T15:00:00Z", tokenCost: 2 },
  { id: "t005", userId: "u004", userNickname: "彩妆控Coco", type: "analysis", status: "completed", inputUrl: "https://example.com/img5.jpg", outputUrl: "", completedAt: "2026-07-31T09:00:42Z", createdAt: "2026-07-31T09:00:00Z", tokenCost: 2 },
];

export const fetchTasks = async (filter: TaskFilter = {}): Promise<PaginatedResult<AiTask>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set("keyword", filter.keyword);
  if (filter.status) params.set("status", filter.status);
  if (filter.type) params.set("type", filter.type);
  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: AiTask[]; total: number; page: number; pageSize: number; totalPages: number }>>(`${API_PATH}?${params.toString()}`),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<AiTask>;
    throw new Error("no data");
  }).catch(() => fallbackMockTasks(filter));
};

export const retryTask = async (taskId: string): Promise<void> => {
  await callOrFallback(
    () => apiClient.post<void>(`${API_PATH}/${encodeURIComponent(taskId)}/retry`),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

async function fallbackMockTasks(filter: TaskFilter = {}): Promise<PaginatedResult<AiTask>> {
  let items = [...MOCK_TASKS];
  if (filter.keyword) items = items.filter((t) => t.userNickname.includes(filter.keyword!));
  if (filter.status) items = items.filter((t) => t.status === filter.status);
  if (filter.type) items = items.filter((t) => t.type === filter.type);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
