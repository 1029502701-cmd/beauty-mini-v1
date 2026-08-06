import React, { useEffect, useState } from "react";
import { fetchContent, updateContentStatus } from "@services/contentService";
import type { ContentItem, ContentFilter } from "@/types";
import "@/styles/table.css";

const ContentPage: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentFilter>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchContent({ ...filter, page, pageSize: 10 });
      setContents(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };
  const handlePublish = async (c: ContentItem) => {
    const next = c.status === "draft" ? "published" : c.status === "published" ? "archived" : "draft";
    await updateContentStatus(c.id, next);
    loadData();
  };

  const typeLabel = (t: string) => ({ article: "文章", video: "视频", image: "图片", carousel: "图文" }[t] || t);
  const statusLabel = (s: string) => ({ draft: "草稿", published: "已发布", archived: "已归档" }[s] || s);

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">内容管理</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索标题..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.type || ""} onChange={(e) => setFilter((f) => ({ ...f, type: (e.target.value as ContentItem["type"]) || undefined }))}>
          <option value="">全部类型</option>
          <option value="article">文章</option>
          <option value="video">视频</option>
          <option value="image">图片</option>
          <option value="carousel">图文</option>
        </select>
        <select className="filter-select" value={filter.status || ""} onChange={(e) => setFilter((f) => ({ ...f, status: (e.target.value as ContentItem["status"]) || undefined }))}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr>
            <th>标题</th><th>类型</th><th>平台</th><th>状态</th>
            <th>浏览</th><th>点赞</th><th>分享</th><th>更新时间</th><th>操作</th>
          </tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={9}>加载中...</td></tr> :
              contents.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td>{typeLabel(c.type)}</td>
                  <td>{c.platform}</td>
                  <td><span className={`status-badge ${c.status}`}>{statusLabel(c.status)}</span></td>
                  <td>{c.views.toLocaleString()}</td>
                  <td>{c.likes.toLocaleString()}</td>
                  <td>{c.shares.toLocaleString()}</td>
                  <td>{new Date(c.updatedAt).toLocaleDateString("zh-CN")}</td>
                  <td>
                    <button className="action-btn" onClick={() => handlePublish(c)}>
                      {c.status === "draft" ? "发布" : c.status === "published" ? "归档" : "恢复"}
                    </button>
                  </td>
                </tr>
              ))
            }
            {!loading && contents.length === 0 && <tr><td colSpan={9} className="table-empty">暂无数据</td></tr>}
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

export default ContentPage;