import React, { useEffect, useState } from "react";
import { fetchUsers, updateUserStatus } from "@services/userService";
import type { User, UserFilter } from "@/types";
import usePermission from "@guard/usePermission";
import Drawer from "@components/ui/Drawer";
import ConfirmModal from "@components/ui/ConfirmModal";
import "@/styles/table.css";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null, action: null });
  const { can } = usePermission();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({ ...filter, page, pageSize: 10 });
      setUsers(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };

  const handleStatusChange = (user: User) => {
    const next = user.status === "active" ? "inactive" : user.status === "inactive" ? "active" : "banned";
    const action = next === "banned" ? "ban" : "activate";
    setConfirmModal({ open: true, user, action });
  };

  const confirmStatusChange = async () => {
    const { user, action } = confirmModal;
    if (!user || !action) return;
    const next = action === "ban" ? "banned" : "active";
    await updateUserStatus(user.id, next);
    setConfirmModal({ open: false, user: null, action: null });
    loadData();
  };

  const statusLabel = (s) => s === "active" ? "活跃" : s === "inactive" ? "不活跃" : "已封禁";

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">用户管理</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索昵称..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.status || ""} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || undefined }))}>
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="inactive">不活跃</option>
          <option value="banned">已封禁</option>
        </select>
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>昵称</th><th>分析次数</th><th>报告数</th><th>Beauty Pro</th><th>状态</th><th>最近活跃</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={7}>加载中...</td></tr> :
              users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.nickname}</strong></td>
                  <td>{u.totalAnalyses}</td>
                  <td>{u.totalReports}</td>
                  <td>{u.beautyPro ? "OK" : "--"}</td>
                  <td><span className={status-badge }>{statusLabel(u.status)}</span></td>
                  <td>{new Date(u.lastActiveAt).toLocaleDateString("zh-CN")}</td>
                  <td>
                    <button className="action-btn" onClick={() => setSelectedUser(u)}>详情</button>
                    {can("users", "edit") && (
                      <button className="action-btn" onClick={() => handleStatusChange(u)}>
                        {u.status === "active" ? "停用" : u.status === "inactive" ? "启用" : "解封"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            }
            {!loading && users.length === 0 && <tr><td colSpan={7} className="table-empty">暂无数据</td></tr>}
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
      <Drawer open={!!selectedUser} title="用户详情" onClose={() => setSelectedUser(null)} width="520px">
        {selectedUser && (
          <div className="user-detail">
            <div className="ud-avatar-row">
              <div className="ud-avatar">{selectedUser.nickname.charAt(0)}</div>
              <div><div className="ud-name">{selectedUser.nickname}</div><div className="ud-id">ID: {selectedUser.id}</div></div>
              <span className={status-badge } style={{ marginLeft: "auto" }}>{statusLabel(selectedUser.status)}</span>
            </div>
            <div className="ud-section-title">基本信息</div>
            <div className="ud-meta">
              <div className="ud-meta-item"><span className="ud-meta-label">注册时间</span><span className="ud-meta-value">{new Date(selectedUser.createdAt).toLocaleDateString("zh-CN")}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">最近活跃</span><span className="ud-meta-value">{new Date(selectedUser.lastActiveAt).toLocaleString("zh-CN")}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">Beauty Pro</span><span className="ud-meta-value">{selectedUser.beautyPro ? "已开通" : "--"}</span></div>
            </div>
            <div className="ud-section-title">数据统计</div>
            <div className="ud-stats">
              <div className="ud-stat"><span className="ud-stat-val">{selectedUser.totalAnalyses}</span><span className="ud-stat-lab">分析次数</span></div>
              <div className="ud-stat"><span className="ud-stat-val">{selectedUser.totalReports}</span><span className="ud-stat-lab">报告数</span></div>
              <div className="ud-stat"><span className="ud-stat-val">{selectedUser.sessionCount}</span><span className="ud-stat-lab">会话数</span></div>
            </div>
          </div>
        )}
      </Drawer>
      <ConfirmModal open={confirmModal.open} title={confirmModal.action === "ban" ? "封禁用户" : "启用用户"} message={confirmModal.action === "ban" ? "确定要封禁用户「」吗？" : "确定要启用用户「」吗？"} variant={confirmModal.action === "ban" ? "danger" : "default"} confirmText={confirmModal.action === "ban" ? "确认封禁" : "确认启用"} onConfirm={confirmStatusChange} onCancel={() => setConfirmModal({ open: false, user: null, action: null })} />
    </div>
  );
};

export default UsersPage;