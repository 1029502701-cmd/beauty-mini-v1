import_path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\pages\tokens\TokensPage.tsx"
with open(import_path, "r", encoding="utf-8") as f:
    c = f.read()

new_content = """import React, { useEffect, useState } from "react";
import { fetchTokenPackages, fetchTokenOrders, updatePackageStatus, updatePackage } from "@services/tokenService";
import type { TokenPackage, TokenOrder, TokenOrderFilter } from "@/types";
import usePermission from "@guard/usePermission";
import Drawer from "@components/ui/Drawer";
import ConfirmModal from "@components/ui/ConfirmModal";
import "@/styles/table.css";

const TokensPage: React.FC = () => {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [orders, setOrders] = useState<TokenOrder[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderFilter, setOrderFilter] = useState<TokenOrderFilter>({});
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [editForm, setEditForm] = useState({ name: "", tokens: 0, price: 0, discountRate: 1 });
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, pkg: null as TokenPackage | null, action: null as string | null });
  const { can } = usePermission();

  const loadPackages = async () => {
    const list = await fetchTokenPackages();
    setPackages(list);
  };

  const loadOrders = async () => {
    const res = await fetchTokenOrders({ ...orderFilter, page: orderPage, pageSize: 10 });
    setOrders(res.items);
    setOrderTotal(res.total);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPackages(), loadOrders()]).finally(() => setLoading(false));
  }, [orderPage]);

  const handleOrderFilter = () => { setOrderPage(1); loadOrders(); };
  const handleOrderReset = () => { setOrderFilter({}); setOrderPage(1); loadOrders(); };
  const handleTogglePackage = (pkg: TokenPackage) => {
    const action = pkg.status === "active" ? "deactivate" : "activate";
    setConfirmModal({ open: true, pkg, action });
  };
  const confirmToggle = async () => {
    const { pkg, action } = confirmModal;
    if (!pkg || !action) return;
    const next = action === "activate" ? "active" : "inactive";
    await updatePackageStatus(pkg.id, next);
    setConfirmModal({ open: false, pkg: null, action: null });
    loadPackages();
  };
  const openEdit = (pkg: TokenPackage) => {
    setEditForm({ name: pkg.name, tokens: pkg.tokens, price: pkg.price, discountRate: pkg.discountRate });
    setSelectedPackage(pkg);
  };
  const handleSave = async () => {
    if (!selectedPackage) return;
    setSaving(true);
    await updatePackage(selectedPackage.id, {
      name: editForm.name,
      tokens: editForm.tokens,
      price: editForm.price,
      discountRate: editForm.discountRate,
    });
    setSaving(false);
    setSelectedPackage(null);
    loadPackages();
  };

  const statusLabel = (s: string) => ({ pending: "待支付", paid: "已支付", refunded: "已退款", failed: "失败" }[s] || s);

  return (
    <div className="users-page">
      <div className="page-header"><h2 className="page-title">Token / 订单</h2></div>
      {loading
        ? <div className="dashboard-loading"><div className="spinner" /><span>加载中...</span></div>
        : <>
            {/* Token Packages */}
            <div className="table-card" style={{ marginBottom: 16 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, fontSize: 14 }}>Token 套餐</div>
              <table className="data-table">
                <thead><tr><th>套餐名</th><th>Token数</th><th>价格</th><th>折扣</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>
                  {packages.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.tokens}</td>
                      <td><strong>{p.price}元</strong></td>
                      <td>{p.discountRate < 1 ? `${(p.discountRate * 10).toFixed(1)}折` : "原价"}</td>
                      <td><span className={`status-badge ${p.status === "active" ? "active" : "inactive"}`}>{p.status === "active" ? "上架" : "下架"}</span></td>
                      <td>
                        {can("tokens", "edit") && (
                          <button className="action-btn" onClick={() => openEdit(p)}>编辑</button>
                        )}
                        {can("tokens", "manage") && (
                          <button className="action-btn" onClick={() => handleTogglePackage(p)}>{p.status === "active" ? "下架" : "上架"}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Orders */}
            <div className="page-header" style={{ marginTop: 8 }}><h2 className="page-title">订单列表</h2></div>
            <div className="filters-bar">
              <input className="filter-input" placeholder="搜索用户..." value={orderFilter.keyword || ""} onChange={(e) => setOrderFilter((f) => ({ ...f, keyword: e.target.value }))} />
              <select className="filter-select" value={orderFilter.status || ""} onChange={(e) => setOrderFilter((f) => ({ ...f, status: (e.target.value as TokenOrder["status"]) || undefined }))}>
                <option value="">全部状态</option>
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="refunded">已退款</option>
                <option value="failed">失败</option>
              </select>
              <button className="filter-btn primary" onClick={handleOrderFilter}>搜索</button>
              <button className="filter-btn secondary" onClick={handleOrderReset}>重置</button>
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead><tr><th>订单号</th><th>用户</th><th>套餐</th><th>Token数</th><th>金额</th><th>状态</th><th>下单时间</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{o.id}</td>
                      <td><strong>{o.userNickname}</strong></td>
                      <td>{o.packageName}</td>
                      <td>{o.tokenAmount}</td>
                      <td><strong>{o.amount}元</strong></td>
                      <td><span className={`status-badge ${o.status}`}>{statusLabel(o.status)}</span></td>
                      <td>{new Date(o.createdAt).toLocaleString("zh-CN")}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} className="table-empty">暂无订单</td></tr>}
                </tbody>
              </table>
              {orderTotal > 0 && (
                <div className="pagination">
                  <span>共 {orderTotal} 条</span>
                  <div className="pagination-btns">
                    <button className="page-btn" disabled={orderPage <= 1} onClick={() => setOrderPage((p) => p - 1)}>上一页</button>
                    <span>第 {orderPage} 页</span>
                    <button className="page-btn" disabled={orderPage >= Math.ceil(orderTotal / 10)} onClick={() => setOrderPage((p) => p + 1)}>下一页</button>
                  </div>
                </div>
              )}
            </div>
          </>
      }
      <Drawer open={!!selectedPackage} title="编辑套餐" onClose={() => setSelectedPackage(null)} width="480px">
        {selectedPackage && (
          <div className="user-detail">
            <div className="ud-section-title">套餐配置</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>套餐名称</label>
                <input className="filter-input" style={{ width: "100%", marginTop: 4 }} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>Token数量</label>
                  <input className="filter-input" style={{ width: "100%", marginTop: 4 }} type="number" value={editForm.tokens} onChange={(e) => setEditForm((f) => ({ ...f, tokens: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>价格（元）</label>
                  <input className="filter-input" style={{ width: "100%", marginTop: 4 }} type="number" step="0.1" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>折扣率（0-1，1为原价）</label>
                <input className="filter-input" style={{ width: "100%", marginTop: 4 }} type="number" step="0.05" min="0" max="1" value={editForm.discountRate} onChange={(e) => setEditForm((f) => ({ ...f, discountRate: Number(e.target.value) }))} />
                <span style={{ fontSize: 12, color: "#6b7280", marginTop: 4, display: "block" }}>
                  折后价格：{(editForm.price * editForm.discountRate).toFixed(2)}元
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="filter-btn primary" onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存"}</button>
              <button className="filter-btn secondary" onClick={() => setSelectedPackage(null)}>取消</button>
            </div>
          </div>
        )}
      </Drawer>
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === "deactivate" ? "下架套餐" : "上架套餐"}
        message={confirmModal.action === "deactivate" ? `确定要下架套餐「${confirmModal.pkg?.name}」吗？` : `确定要上架套餐「${confirmModal.pkg?.name}」吗？`}
        variant={confirmModal.action === "deactivate" ? "danger" : "default"}
        confirmText={confirmModal.action === "deactivate" ? "确认下架" : "确认上架"}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal({ open: false, pkg: null, action: null })}
      />
    </div>
  );
};

export default TokensPage;
"""

with open(import_path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("TokensPage.tsx updated, len:", len(new_content))
