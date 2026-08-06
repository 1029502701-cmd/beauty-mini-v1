import React, { useEffect, useState } from "react";
import { fetchReports, deleteReport, fetchReportDetail, unlockReport } from "@services/reportService";
import type { BeautyReport, ReportFilter } from "@/types";
import usePermission from "@guard/usePermission";
import Drawer from "@components/ui/Drawer";
import ConfirmModal from "@components/ui/ConfirmModal";
import "@/styles/table.css";

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<BeautyReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>({});
  const [selectedReport, setSelectedReport] = useState<BeautyReport | null>(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, reportId: null as string | null });
  const [unlockModal, setUnlockModal] = useState({ open: false, reportId: null as string | null, status: "locked" as "locked" | "unlocked" });
  const { can } = usePermission();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchReports({ ...filter, page, pageSize: 10 });
      setReports(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };
  const handleDelete = (id: string) => { setDeleteModal({ open: true, reportId: id }); };
  const confirmDelete = async () => {
    if (!deleteModal.reportId) return;
    await deleteReport(deleteModal.reportId);
    setDeleteModal({ open: false, reportId: null });
    loadData();
  };
  const handleUnlock = (report: BeautyReport, status: "locked" | "unlocked") => {
    setUnlockModal({ open: true, reportId: report.id, status });
  };
  const confirmUnlock = async () => {
    if (!unlockModal.reportId) return;
    await unlockReport(unlockModal.reportId, unlockModal.status);
    setUnlockModal({ open: false, reportId: null, status: "locked" });
    loadData();
  };

  const levelLabel = (l: string) => l === "advanced" ? "专属美学" : l === "intermediate" ? "风格进阶" : "初见妆容";
  const statusLabel = (s: string) => s === "completed" ? "已完成" : "失败";
  const unlockLabel = (s: string) => s === "free" ? "免费" : s === "locked" ? "已锁定" : "已解锁";

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">美妆报告</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索用户..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.status || ""} onChange={(e) => setFilter((f) => ({ ...f, status: (e.target.value as BeautyReport["status"]) || undefined }))}>
          <option value="">全部状态</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
        <select className="filter-select" value={filter.level || ""} onChange={(e) => setFilter((f) => ({ ...f, level: (e.target.value as BeautyReport["level"]) || undefined }))}>
          <option value="">全部等级</option>
          <option value="beginner">初见妆容</option>
          <option value="intermediate">风格进阶</option>
          <option value="advanced">专属美学</option>
        </select>
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr>
            <th>用户</th><th>脸型</th><th>眼型</th><th>肤色</th><th>综合评分</th>
            <th>等级</th><th>状态</th><th>解锁状态</th><th>创建时间</th><th>操作</th>
          </tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={10}>加载中...</td></tr> :
              reports.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.userNickname}</strong></td>
                  <td>{r.faceShape}</td><td>{r.eyeShape}</td><td>{r.skinTone}</td>
                  <td><strong>{r.overallScore}</strong></td>
                  <td><span className={`status-badge level-${r.level}`}>{levelLabel(r.level)}</span></td>
                  <td><span className={`status-badge ${r.status}`}>{statusLabel(r.status)}</span></td>
                  <td><span className={`status-badge ${r.unlockStatus === "free" ? "active" : r.unlockStatus === "locked" ? "pending" : "published"}`}>{unlockLabel(r.unlockStatus)}</span></td>
                  <td>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td>
                    <button className="action-btn" onClick={() => setSelectedReport(r)}>详情</button>
                    {can("reports", "delete") && (
                      <button className="action-btn danger" onClick={() => handleDelete(r.id)}>删除</button>
                    )}
                  </td>
                </tr>
              ))
            }
            {!loading && reports.length === 0 && <tr><td colSpan={10} className="table-empty">暂无数据</td></tr>}
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
      <Drawer open={!!selectedReport} title="报告详情" onClose={() => setSelectedReport(null)} width="560px">
        {selectedReport && (
          <div className="user-detail">
            <div className="ud-avatar-row">
              <div className="ud-avatar" style={{ background: "#fce7f3", color: "#be185d" }}>{selectedReport.userNickname.charAt(0)}</div>
              <div>
                <div className="ud-name">{selectedReport.userNickname}</div>
                <div className="ud-id">报告 ID: {selectedReport.id}</div>
              </div>
              <span className={`status-badge ${selectedReport.status}`} style={{ marginLeft: "auto" }}>{statusLabel(selectedReport.status)}</span>
            </div>

            <div className="ud-section-title">解锁状态</div>
            <div className="ud-meta" style={{ marginBottom: 8 }}>
              <div className="ud-meta-item">
                <span className="ud-meta-label">解锁状态</span>
                <span className="ud-meta-value">
                  <span className={`status-badge ${selectedReport.unlockStatus === "free" ? "active" : selectedReport.unlockStatus === "locked" ? "pending" : "published"}`}>
                    {unlockLabel(selectedReport.unlockStatus)}
                  </span>
                </span>
              </div>
            </div>
            {can("reports", "edit") && selectedReport.unlockStatus !== "free" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button className="action-btn" onClick={() => handleUnlock(selectedReport, "unlocked")}>解锁</button>
                <button className="action-btn" onClick={() => handleUnlock(selectedReport, "locked")}>锁定</button>
              </div>
            )}

            <div className="ud-section-title">分析结果</div>
            <div className="ud-meta">
              <div className="ud-meta-item"><span className="ud-meta-label">脸型</span><span className="ud-meta-value">{selectedReport.faceShape}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">眼型</span><span className="ud-meta-value">{selectedReport.eyeShape}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">肤色</span><span className="ud-meta-value">{selectedReport.skinTone}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">综合评分</span><span className="ud-meta-value" style={{ fontWeight: 700, color: "#be185d" }}>{selectedReport.overallScore}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">报告等级</span><span className="ud-meta-value"><span className={`status-badge level-${selectedReport.level}`}>{levelLabel(selectedReport.level)}</span></span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">创建时间</span><span className="ud-meta-value">{new Date(selectedReport.createdAt).toLocaleString("zh-CN")}</span></div>
            </div>
            {selectedReport.analysisContent && (
              <>
                <div className="ud-section-title">分析详情</div>
                <div className="ud-error-box" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", whiteSpace: "pre-wrap" }}>{selectedReport.analysisContent}</div>
              </>
            )}
          </div>
        )}
      </Drawer>
      <ConfirmModal open={deleteModal.open} title="删除报告" message="确定要删除此报告吗？此操作不可恢复。" variant="danger" confirmText="确认删除" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, reportId: null })} />
      <ConfirmModal open={unlockModal.open} title={unlockModal.status === "unlocked" ? "解锁报告" : "锁定报告"} message={unlockModal.status === "unlocked" ? "确定要解锁此报告吗？解锁后将允许用户查看详细分析。" : "确定要锁定此报告吗？锁定后将隐藏详细分析内容。"} variant={unlockModal.status === "locked" ? "danger" : "default"} confirmText={unlockModal.status === "unlocked" ? "确认解锁" : "确认锁定"} onConfirm={confirmUnlock} onCancel={() => setUnlockModal({ open: false, reportId: null, status: "locked" })} />
    </div>
  );
};

export default ReportsPage;
