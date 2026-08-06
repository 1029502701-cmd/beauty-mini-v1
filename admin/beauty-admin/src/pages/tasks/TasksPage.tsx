import React, { useEffect, useState } from "react";
import { fetchTasks, retryTask } from "@services/taskService";
import type { AiTask, TaskFilter } from "@/types";
import usePermission from "@guard/usePermission";
import Drawer from "@components/ui/Drawer";
import "@/styles/table.css";

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [selectedTask, setSelectedTask] = useState<AiTask | null>(null);
  const { can } = usePermission();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ ...filter, page, pageSize: 10 });
      setTasks(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };
  const handleRetry = async (id) => { await retryTask(id); loadData(); };

  const typeLabel = (t) => t === "analysis" ? "AI分析" : "推荐";
  const statusLabel = (s) => ({ pending: "待处理", running: "运行中", completed: "已完成", failed: "失败" }[s] || s);

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">AI 分析任务</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索用户..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.status || ""} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || undefined }))}>
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="running">运行中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
        <select className="filter-select" value={filter.type || ""} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value || undefined }))}>
          <option value="">全部类型</option>
          <option value="analysis">AI分析</option>
          <option value="recommendation">推荐</option>
        </select>
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>用户</th><th>类型</th><th>状态</th><th>Token消耗</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={6}>加载中...</td></tr> :
              tasks.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.userNickname}</strong></td>
                  <td>{typeLabel(t.type)}</td>
                  <td><span className={status-badge }>{statusLabel(t.status)}</span></td>
                  <td>{t.tokenCost}</td>
                  <td>{new Date(t.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td>
                    <button className="action-btn" onClick={() => setSelectedTask(t)}>详情</button>
                    {can("tasks", "edit") && t.status === "failed" && (
                      <button className="action-btn" onClick={() => handleRetry(t.id)}>重试</button>
                    )}
                  </td>
                </tr>
              ))
            }
            {!loading && tasks.length === 0 && <tr><td colSpan={6} className="table-empty">暂无数据</td></tr>}
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
      <Drawer open={!!selectedTask} title="任务详情" onClose={() => setSelectedTask(null)} width="520px">
        {selectedTask && (
          <div className="user-detail">
            <div className="ud-avatar-row">
              <div className="ud-avatar" style={{ background: "#ede9fe", color: "#5b21b6" }}>OK</div>
              <div><div className="ud-name">{selectedTask.userNickname}</div><div className="ud-id">任务 ID: {selectedTask.id}</div></div>
              <span className={status-badge } style={{ marginLeft: "auto" }}>{statusLabel(selectedTask.status)}</span>
            </div>
            <div className="ud-section-title">任务信息</div>
            <div className="ud-meta">
              <div className="ud-meta-item"><span className="ud-meta-label">任务类型</span><span className="ud-meta-value">{typeLabel(selectedTask.type)}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">Token 消耗</span><span className="ud-meta-value">{selectedTask.tokenCost}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">输入链接</span><span className="ud-meta-value" style={{ wordBreak: "break-all" }}>{selectedTask.inputUrl}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">创建时间</span><span className="ud-meta-value">{new Date(selectedTask.createdAt).toLocaleString("zh-CN")}</span></div>
              {selectedTask.completedAt && (
                <div className="ud-meta-item"><span className="ud-meta-label">完成时间</span><span className="ud-meta-value">{new Date(selectedTask.completedAt).toLocaleString("zh-CN")}</span></div>
              )}
            </div>
            {selectedTask.errorMessage && (
              <><div className="ud-section-title">错误信息</div><div className="ud-error-box">{selectedTask.errorMessage}</div></>
            )}
            {selectedTask.outputUrl && (
              <div className="ud-meta"><div className="ud-meta-item"><span className="ud-meta-label">输出链接</span><span className="ud-meta-value" style={{ wordBreak: "break-all" }}>{selectedTask.outputUrl}</span></div></div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TasksPage;