import React, { useEffect, useState } from "react";
import { fetchProducts, updateProduct, updateProductTags } from "@services/productService";
import type { Product, ProductFilter } from "@/types";
import usePermission from "@guard/usePermission";
import ConfirmModal from "@components/ui/ConfirmModal";
import Drawer from "@components/ui/Drawer";
import "@/styles/table.css";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, product: null as Product | null, action: null as string | null });
  const { can } = usePermission();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchProducts({ ...filter, page, pageSize: 10 });
      setProducts(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleFilter = () => { setPage(1); loadData(); };
  const handleReset = () => { setFilter({}); setPage(1); loadData(); };
  const handleToggle = (prod: Product) => {
    const action = prod.status === "active" ? "deactivate" : "activate";
    setConfirmModal({ open: true, product: prod, action });
  };
  const confirmToggle = async () => {
    const { product, action } = confirmModal;
    if (!product || !action) return;
    const next = action === "activate" ? "active" : "inactive";
    await updateProduct(product.id, { status: next });
    setConfirmModal({ open: false, product: null, action: null });
    loadData();
  };
  const handleSaveTags = async () => {
    if (!selectedProduct) return;
    setSavingTags(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await updateProductTags(selectedProduct.id, tags);
    setSavingTags(false);
    loadData();
    setSelectedProduct({ ...selectedProduct, recommendedTags: tags });
  };

  const statusLabel = (s: string) => s === "active" ? "上架" : s === "inactive" ? "下架" : "售罄";
  const statusBadge = (s: string) => s === "active" ? "active" : s === "inactive" ? "inactive" : "sold_out";

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">产品推荐</h2></div>
      <div className="filters-bar">
        <input className="filter-input" placeholder="搜索商品..." value={filter.keyword || ""} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} />
        <select className="filter-select" value={filter.category || ""} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value || undefined }))}>
          <option value="">全部类目</option>
          <option value="唇妆">唇妆</option>
          <option value="眼妆">眼妆</option>
          <option value="底妆">底妆</option>
          <option value="修容">修容</option>
        </select>
        <select className="filter-select" value={filter.status || ""} onChange={(e) => setFilter((f) => ({ ...f, status: (e.target.value as Product["status"]) || undefined }))}>
          <option value="">全部状态</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
          <option value="sold_out">售罄</option>
        </select>
        <button className="filter-btn primary" onClick={handleFilter}>搜索</button>
        <button className="filter-btn secondary" onClick={handleReset}>重置</button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead><tr>
            <th>商品名称</th><th>品牌</th><th>类目</th><th>价格</th><th>库存</th>
            <th>平台</th><th>状态</th><th>推荐标签</th><th>操作</th>
          </tr></thead>
          <tbody>
            {loading ? <tr className="loading-row"><td colSpan={9}>加载中...</td></tr> :
              products.map((prod) => (
                <tr key={prod.id}>
                  <td><strong>{prod.name}</strong><br /><span style={{ fontSize: 12, color: "#6b7280" }}>{prod.description.slice(0, 30)}{prod.description.length > 30 ? "..." : ""}</span></td>
                  <td>{prod.brand}</td><td>{prod.category}</td>
                  <td>{prod.originalPrice ? <><span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 12 }}>{prod.originalPrice}元</span> <strong style={{ color: "#be185d" }}>{prod.price}元</strong></> : <strong>{prod.price}元</strong>}</td>
                  <td>{prod.stock > 0 ? prod.stock : <span style={{ color: "#dc2626" }}>已售罄</span>}</td>
                  <td>{prod.platform}</td>
                  <td><span className={`status-badge ${statusBadge(prod.status)}`}>{statusLabel(prod.status)}</span></td>
                  <td>{(prod.recommendedTags || []).slice(0, 2).map((t, i) => <span key={i} className="status-badge level-advanced" style={{ marginRight: 4 }}>{t}</span>)}</td>
                  <td>
                    <button className="action-btn" onClick={() => { setSelectedProduct(prod); setTagInput((prod.recommendedTags || []).join(", ")); }}>标签</button>
                    {can("products", "edit") && prod.status !== "sold_out" && (
                      <button className="action-btn" onClick={() => handleToggle(prod)}>{prod.status === "active" ? "下架" : "上架"}</button>
                    )}
                  </td>
                </tr>
              ))
            }
            {!loading && products.length === 0 && <tr><td colSpan={9} className="table-empty">暂无数据</td></tr>}
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
      <Drawer open={!!selectedProduct} title="产品详情" onClose={() => setSelectedProduct(null)} width="560px">
        {selectedProduct && (
          <div className="user-detail">
            <div className="ud-avatar-row">
              <div className="ud-avatar" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{selectedProduct.name.charAt(0)}</div>
              <div>
                <div className="ud-name">{selectedProduct.name}</div>
                <div className="ud-id">{selectedProduct.brand} · {selectedProduct.category}</div>
              </div>
              <span className={`status-badge ${statusBadge(selectedProduct.status)}`} style={{ marginLeft: "auto" }}>{statusLabel(selectedProduct.status)}</span>
            </div>
            <div className="ud-section-title">商品信息</div>
            <div className="ud-meta">
              <div className="ud-meta-item"><span className="ud-meta-label">价格</span><span className="ud-meta-value">{selectedProduct.originalPrice ? <><span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 12 }}>{selectedProduct.originalPrice}元</span> <strong style={{ color: "#be185d" }}>{selectedProduct.price}元</strong></> : <strong>{selectedProduct.price}元</strong>}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">库存</span><span className="ud-meta-value">{selectedProduct.stock > 0 ? selectedProduct.stock : <span style={{ color: "#dc2626" }}>已售罄</span>}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">平台</span><span className="ud-meta-value">{selectedProduct.platform}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">联盟链接</span><span className="ud-meta-value" style={{ wordBreak: "break-all", fontSize: 11 }}>{selectedProduct.affiliateLink}</span></div>
              <div className="ud-meta-item"><span className="ud-meta-label">是否推荐</span><span className="ud-meta-value">{selectedProduct.featured ? <span className="status-badge active">是</span> : "--"}</span></div>
            </div>
            <div className="ud-section-title">产品描述</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 16 }}>{selectedProduct.description}</div>
            <div className="ud-section-title">推荐标签</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {(selectedProduct.recommendedTags || []).map((t, i) => (
                <span key={i} className="status-badge level-advanced">{t}</span>
              ))}
            </div>
            {can("products", "edit") && (
              <div style={{ display: "flex", gap: 8 }}>
                <input className="filter-input" style={{ flex: 1 }} placeholder="输入标签，逗号分隔" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                <button className="filter-btn primary" onClick={handleSaveTags} disabled={savingTags}>{savingTags ? "保存中..." : "保存标签"}</button>
              </div>
            )}
          </div>
        )}
      </Drawer>
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === "deactivate" ? "下架商品" : "上架商品"}
        message={confirmModal.action === "deactivate" ? `确定要下架商品「${confirmModal.product?.name}」吗？` : `确定要上架商品「${confirmModal.product?.name}」吗？`}
        variant={confirmModal.action === "deactivate" ? "danger" : "default"}
        confirmText={confirmModal.action === "deactivate" ? "确认下架" : "确认上架"}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal({ open: false, product: null, action: null })}
      />
    </div>
  );
};

export default ProductsPage;
