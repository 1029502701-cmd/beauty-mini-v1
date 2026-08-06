import React, { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "@services/settingsService";
import type { SystemSettings } from "@/types";
import "@/styles/table.css";

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  const handleSave = async (section: keyof SystemSettings, key: string, value: string | boolean | number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    });
  };

  const handlePersist = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="dashboard-loading"><div className="spinner" /><span>加载中...</span></div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <h2 className="page-title">系统设置</h2>
        <button className="filter-btn primary" onClick={handlePersist} disabled={saving}>
          {saving ? "保存中..." : saved ? "已保存 ✓" : "保存设置"}
        </button>
      </div>

      {/* AI 分析 */}
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, fontSize: 14 }}>AI 分析配置</div>
        <div style={{ padding: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          <Field label="分析提供商" value={settings.aiAnalysis.provider} onChange={(v) => handleSave("aiAnalysis", "provider", v)} />
          <Field label="模型" value={settings.aiAnalysis.model} onChange={(v) => handleSave("aiAnalysis", "model", v)} />
          <Field label="最大并发数" type="number" value={String(settings.aiAnalysis.maxConcurrency)} onChange={(v) => handleSave("aiAnalysis", "maxConcurrency", Number(v))} />
          <Field label="超时(ms)" type="number" value={String(settings.aiAnalysis.timeoutMs)} onChange={(v) => handleSave("aiAnalysis", "timeoutMs", Number(v))} />
          <ToggleField label="功能启用" checked={settings.aiAnalysis.enabled} onChange={(v) => handleSave("aiAnalysis", "enabled", v)} />
        </div>
      </div>

      {/* Beauty Pro */}
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, fontSize: 14 }}>Beauty Pro 会员</div>
        <div style={{ padding: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          <ToggleField label="功能启用" checked={settings.beautyPro.enabled} onChange={(v) => handleSave("beautyPro", "enabled", v)} />
          <Field label="试用天数" type="number" value={String(settings.beautyPro.trialDays)} onChange={(v) => handleSave("beautyPro", "trialDays", Number(v))} />
          <Field label="月费(元)" type="number" value={String(settings.beautyPro.price)} onChange={(v) => handleSave("beautyPro", "price", Number(v))} />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>会员权益</label>
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {settings.beautyPro.features.map((f, i) => (
                <span key={i} style={{ padding: "3px 10px", background: "#ede9fe", borderRadius: 20, fontSize: 12, color: "#5b21b6" }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 平台配置 */}
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, fontSize: 14 }}>平台配置</div>
        <div style={{ padding: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          <Field label="微信小程序 AppID" value={settings.platform.wechatAppId} onChange={(v) => handleSave("platform", "wechatAppId", v)} />
          <Field label="域名" value={settings.platform.domain} onChange={(v) => handleSave("platform", "domain", v)} />
          <Field label="版权信息" value={settings.platform.copyright} onChange={(v) => handleSave("platform", "copyright", v)} />
          <div style={{ gridColumn: "1 / -1" }}>
            <ToggleField label="微信通知" checked={settings.notification.wechatEnabled} onChange={(v) => handleSave("notification", "wechatEnabled", v)} />
            <ToggleField label="邮件通知" checked={settings.notification.emailEnabled} onChange={(v) => handleSave("notification", "emailEnabled", v)} style={{ marginTop: 8 }} />
            <ToggleField label="短信通知" checked={settings.notification.smsEnabled} onChange={(v) => handleSave("notification", "smsEnabled", v)} style={{ marginTop: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  type?: "text" | "number";
  onChange: (v: string) => void;
}

const Field: React.FC<FieldProps> = ({ label, value, type = "text", onChange }) => (
  <div>
    <label style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ marginTop: 4, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
    />
  </div>
);

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  style?: React.CSSProperties;
}

const ToggleField: React.FC<ToggleFieldProps> = ({ label, checked, onChange, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
    <label style={{ fontWeight: 500, fontSize: 13, color: "#374151", cursor: "pointer" }}>{label}</label>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: checked ? "#f472b6" : "#e5e7eb", position: "relative", transition: "background 0.2s",
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
        left: checked ? 23 : 3, transition: "left 0.2s",
      }} />
    </button>
  </div>
);

export default SettingsPage;