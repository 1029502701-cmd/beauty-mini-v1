content = """import React, { useEffect, useState } from "react";
import { fetchOperationLogs } from "@services/operationLogService";
import type { AdminOperationLog, OperationLogFilter, OperationLogActionType } from "@/types";
import usePermission from "@guard/usePermission";
import "@/styles/table.css";

const ACTION_LABELS: Record<OperationLogActionType, string> = {
  report_unlock: "解锁报告",
  creator_review: "达人审核",
  creator_toggle: "达人上下架",
  product_toggle: "产品上下架",
  product_tag_update: "更新推荐标签",
  package_edit: "编辑套餐",
  package_toggle: "套餐上下架",
  user_status_change: "用户状态变更",
};

const ActionBadge: React.FC<{ type: OperationLogActionType }> = ({ type }) => (
  <span className="status-badge pending">{ACTION_LABELS[type] || type}</span>
);

const OperationLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminOperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OperationLogFilter>({});
  const { can } = usePermission();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchOperationLogs({ ...filter, page, pageSize: 10 });
      setLogs(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">操作日志</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索操作人/目标..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.actionType || ""} onChange={(e) => setFilter((f) => ({ ...f, actionType: (e.target.value as OperationLogActionType) || undefined }))}>
          <option value="">全部类型</option>
          <option value="report_unlock">解锁报告</option>
          <option value="creator_review">达人审核</option>
          <option value="creator_toggle">达人上下架</option>
          <option value="product_toggle">产品上下架</option>
          <option value="product_tag_update">更新推荐标签</option>
          <option value="package_edit">编辑套餐</option>
          <option value="package_toggle">套餐上下架</option>
          <option value="user_status_change">用户状态变更</option>
        </select>
        <input
          className="filter-input"
          type="date"
          value={filter.dateFrom || ""}
          onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
          style={{ width: 140 }}
        />
        <input
          className="filter-input"
          type="date"
          value={filter.dateTo || ""}
          onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value || undefined }))}
          style={{ width: 140 }}
        />
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
        {can("logs", "export") && (
          <button className="filter-btn secondary" onClick={() => alert("导出功能开发中")}>导出</button>
        )}
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr>
            <th>操作人</th><th>操作类型</th><th>目标类型</th><th>目标名称</th>
            <th>详情</th><th>操作时间</th>
          </tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={6}>加载中...</td></tr> :
              logs.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.adminName}</strong><br /><span style={{ fontSize: 11, color: "#9ca3af" }}>ID: {log.adminId}</span></td>
                  <td><ActionBadge type={log.actionType} /></td>
                  <td>{log.targetType}</td>
                  <td>{log.targetName}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.detail || "--"}</td>
                  <td>{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))
            }
            {!loading && logs.length === 0 && <tr><td colSpan={6} className="table-empty">暂无操作日志</td></tr>}
          </tbody>
        </table>
        {total > 0 && (
          <div className="pagination">
            <span>共 {total} 条</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
              <span>第 {page} 页</span>
              <button className="page-btn" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)}>下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationLogsPage;
"""
with open(r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\pages\logs\OperationLogsPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("OperationLogsPage.tsx created, len:", len(content))
