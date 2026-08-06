import_path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\pages\creators\CreatorsPage.tsx"
with open(import_path, "r", encoding="utf-8") as f:
    c = f.read()

new_content = """import React, { useEffect, useState } from "react";
import { fetchCreators, updateCreator, updateCreatorTags } from "@services/creatorService";
import type { Creator, CreatorFilter } from "@/types";
import usePermission from "@guard/usePermission";
import Drawer from "@components/ui/Drawer";
import ConfirmModal from "@components/ui/ConfirmModal";
import "@/styles/table.css";

const CreatorsPage: React.FC = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CreatorFilter>({});
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, creator: null as Creator | null, action: null as string | null });
  const { can } = usePermission();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchCreators({ ...filter, page, pageSize: 10 });
      setCreators(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };

  const formatFollowers = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n);
  const statusLabel = (s: string) => ({ pending: "待对接", active: "合作中", inactive: "已停止", blacklisted: "黑名单" }[s] || s);
  const statusBadge = (s: string) => ({ pending: "pending", active: "active", inactive: "inactive", blacklisted: "banned" }[s] || s);

  const handleStatusChange = (creator: Creator) => {
    const next = creator.cooperationStatus === "pending" ? "active" :
                 creator.cooperationStatus === "active" ? "inactive" :
                 creator.cooperationStatus === "inactive" ? "pending" : "active";
    setConfirmModal({ open: true, creator, action: next });
  };
  const confirmStatusChange = async () => {
    const { creator, action } = confirmModal;
    if (!creator || !action) return;
    await updateCreator(creator.id, { cooperationStatus: action as Creator["cooperationStatus"] });
    setConfirmModal({ open: false, creator: null, action: null });
    loadData();
  };
  const handleReview = (creator: Creator, approved: boolean) => {
    const next = approved ? "active" : "inactive";
    setConfirmModal({ open: true, creator, action: next });
  };
  const handleSaveTags = async () => {
    if (!selectedCreator) return;
    setSavingTags(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await updateCreatorTags(selectedCreator.id, tags);
    setSavingTags(false);
    loadData();
    setSelectedCreator({ ...selectedCreator, matchTags: tags });
  };

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">达人管理</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索达人名称..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.platform || ""} onChange={(e) => setFilter((f) => ({ ...f, platform: (e.target.value as Creator["platform"]) || undefined }))}>
          <option value="">全部平台</option>
          <option value="小红书">小红书</option>
          <option value="抖音">抖音</option>
          <option value="B站">B站</option>
          <option value="微博">微博</option>
        </select>
        <select className="filter-select" value={filter.cooperationStatus || ""} onChange={(e) => setFilter((f) => ({ ...f, cooperationStatus: (e.target.value as Creator["cooperationStatus"]) || undefined }))}>
          <option value="">全部状态</option>
          <option value="pending">待对接</option>
          <option value="active">合作中</option>
          <option value="inactive">已停止</option>
          <option value="blacklisted">黑名单</option>
        </select>
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr>
            <th>名称</th><th>平台</th><th>粉丝数</th><th>类别</th><th>合作状态</th>
            <th>合作次数</th><th>标签</th><th>创建时间</th><th>操作</th>
          </tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={9}>加载中...</td></tr> :
              creators.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong><br /><span style={{ fontSize: 12, color: "#6b7280" }}>{c.bio}</span></td>
                  <td>{c.platform}</td>
                  <td>{formatFollowers(c.followers)}</td>
                  <td>{c.category}</td>
                  <td><span className={`status-badge ${statusBadge(c.cooperationStatus)}`}>{statusLabel(c.cooperationStatus)}</span></td>
                  <td>{c.totalCollaborations}</td>
                  <td>{(c.matchTags || []).slice(0, 2).map((t, i) => <span key={i} className="status-badge pending" style={{ marginRight: 4 }}>{t}</span>)}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td>
                    <button className="action-btn" onClick={() => { setSelectedCreator(c); setTagInput((c.matchTags || []).join(", ")); }}>标签</button>
                    {can("creators", "edit") && (
                      <>
                        <button className="action-btn" onClick={() => handleStatusChange(c)}>
                          {c.cooperationStatus === "pending" ? "启用" : c.cooperationStatus === "active" ? "暂停" : "恢复"}
                        </button>
                        {c.cooperationStatus === "pending" && (
                          <button className="action-btn" onClick={() => handleReview(c, true)}>审核通过</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            }
            {!loading && creators.length === 0 && <tr><td colSpan={9} className="table-empty">暂无数据</td></tr>}
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
      <Drawer open={!!selectedCreator} title="达人详情" onClose={() => setSelectedCreator(null)} width="520px">
        {selectedCreator && (
          <div className="user-detail">
            <div className="ud-avatar-row">
              <div className="ud-avatar" style={{ background: "#ede9fe", color: "#5b21b6" }}>{selectedCreator.name.charAt(0)}</div>
              <div>
                <div className="ud-name">{selectedCreator.name}</div>
                <div className="ud-id">{selectedCreator.platform} · {selectedCreator.category}</div>
              </div>
              <span className={`status-badge ${statusBadge(selectedCreator.cooperationStatus)}`} style={{ marginLeft: "auto" }}>{statusLabel(selectedCreator.cooperationStatus)}</span>
            </div>
            <div className="ud-section-title">联系方式</div>
            <div className="ud-meta">
              <div className="ud-meta-item"><span className="ud-meta-label">微信</span><span className="ud-meta-value">{selectedCreator.contactWechat || "—"}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">邮箱</span><span className="ud-meta-value">{selectedCreator.contactEmail || "—"}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">电话</span><span className="ud-meta-value">{selectedCreator.contactPhone || "—"}</span></div>
            </div>
            <div className="ud-section-title">匹配标签</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {(selectedCreator.matchTags || []).map((t, i) => (
                <span key={i} className="status-badge pending">{t}</span>
              ))}
            </div>
            {can("creators", "edit") && (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="filter-input"
                  style={{ flex: 1 }}
                  placeholder="输入标签，逗号分隔"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <button className="filter-btn primary" onClick={handleSaveTags} disabled={savingTags}>
                  {savingTags ? "保存中..." : "保存标签"}
                </button>
              </div>
            )}
            <div className="ud-section-title">数据</div>
            <div className="ud-stats">
              <div className="ud-stat"><span className="ud-stat-val">{formatFollowers(selectedCreator.followers)}</span><span className="ud-stat-lab">粉丝数</span></div>
              <div className="ud-stat"><span className="ud-stat-val">{selectedCreator.totalCollaborations}</span><span className="ud-stat-lab">合作次数</span></div>
            </div>
            {can("creators", "edit") && selectedCreator.cooperationStatus === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="filter-btn primary" onClick={() => handleReview(selectedCreator, true)}>审核通过</button>
                <button className="filter-btn secondary" onClick={() => handleReview(selectedCreator, false)}>拒绝</button>
              </div>
            )}
          </div>
        )}
      </Drawer>
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === "active" ? "启用达人" : confirmModal.action === "inactive" ? "暂停达人" : confirmModal.action === "pending" ? "待对接" : "确认操作"}
        message={`确定要将达人「${confirmModal.creator?.name}」设为「${confirmModal.action === "active" ? "合作中" : confirmModal.action === "inactive" ? "已停止" : "待对接"}」吗？`}
        variant={confirmModal.action === "inactive" ? "danger" : "default"}
        confirmText="确认"
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmModal({ open: false, creator: null, action: null })}
      />
    </div>
  );
};

export default CreatorsPage;
"""

with open(import_path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("CreatorsPage.tsx updated, len:", len(new_content))
