content = """import { apiClient, callOrFallback } from "./apiClient";
import type { AdminOperationLog, OperationLogFilter, PaginatedResult, ApiResponse } from "@/types";

const API_PATH = "/api/admin/operation-logs";

const MOCK_LOGS: AdminOperationLog[] = [
  { id: "log001", adminId: "a001", adminName: "管理员A", actionType: "report_unlock", targetType: "report", targetId: "r001", targetName: "小美的报告", detail: "解锁高级报告", createdAt: "2026-07-31T14:30:00Z" },
  { id: "log002", adminId: "a002", adminName: "管理员B", actionType: "creator_review", targetType: "creator", targetId: "c001", targetName: "小圆脸美妆", detail: "审核通过", createdAt: "2026-07-31T12:00:00Z" },
  { id: "log003", adminId: "a001", adminName: "管理员A", actionType: "product_toggle", targetType: "product", targetId: "p001", targetName: "丝绒哑光唇釉", detail: "下架操作", createdAt: "2026-07-31T10:15:00Z" },
  { id: "log004", adminId: "a002", adminName: "管理员B", actionType: "package_toggle", targetType: "package", targetId: "pkg004", targetName: "年度会员", detail: "上架套餐", createdAt: "2026-07-30T16:00:00Z" },
  { id: "log005", adminId: "a001", adminName: "管理员A", actionType: "user_status_change", targetType: "user", targetId: "u005", targetName: "小白用户", detail: "封禁用户", createdAt: "2026-07-30T09:00:00Z" },
];

export const fetchOperationLogs = async (filter: OperationLogFilter = {}): Promise<PaginatedResult<AdminOperationLog>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set("keyword", filter.keyword);
  if (filter.actionType) params.set("actionType", filter.actionType);
  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: AdminOperationLog[]; total: number; page: number; pageSize: number; totalPages: number }>>(`${API_PATH}?${params.toString()}`),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<AdminOperationLog>;
    throw new Error("no data");
  }).catch(() => fallbackMockLogs(filter));
};

async function fallbackMockLogs(filter: OperationLogFilter = {}): Promise<PaginatedResult<AdminOperationLog>> {
  let items = [...MOCK_LOGS];
  if (filter.keyword) items = items.filter((l) => l.adminName.includes(filter.keyword!) || l.targetName.includes(filter.keyword!));
  if (filter.actionType) items = items.filter((l) => l.actionType === filter.actionType);
  if (filter.dateFrom) items = items.filter((l) => l.createdAt >= filter.dateFrom!);
  if (filter.dateTo) items = items.filter((l) => l.createdAt <= filter.dateTo!);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};
"""
with open(r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\operationLogService.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("operationLogService.ts created, len:", len(content))
