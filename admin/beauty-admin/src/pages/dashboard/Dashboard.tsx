import React, { useEffect, useState } from "react";
import { getStats } from "@services/dashboardService";
import type { DashboardStats } from "@/types";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <span>加载数据中...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-error">
        <span>加载失败：{error || "未知错误"}</span>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Section title="用户" icon="??" color="#3b82f6">
        <StatCard label="总用户数" value={stats.users.total.toLocaleString()} />
        <StatCard label="今日新增" value={stats.users.todayNew.toLocaleString()} highlight />
      </Section>

      <Section title="AI 分析" icon="??" color="#8b5cf6">
        <StatCard label="总分析次数" value={stats.ai.totalAnalyses.toLocaleString()} />
        <StatCard label="成功报告" value={stats.ai.successfulReports.toLocaleString()} success />
        <StatCard label="失败任务" value={stats.ai.failedTasks.toLocaleString()} danger />
      </Section>

      <Section title="商业指标" icon="??" color="#f59e0b">
        <StatCard label="Token 消耗总量" value={stats.commerce.tokenConsumed.toLocaleString()} />
        <StatCard label="专属美学（Beauty Pro）" value={stats.commerce.beautyProCount.toLocaleString()} highlight />
      </Section>

      <Section title="推荐数据" icon="??" color="#10b981">
        <StatCard label="商品推荐次数" value={stats.recommendations.productRecommendations.toLocaleString()} />
        <StatCard label="达人推荐次数" value={stats.recommendations.creatorRecommendations.toLocaleString()} />
      </Section>

      <Section title="订单" icon="??" color="#ec4899">
        <StatCard label="总订单数" value={stats.orders.total.toLocaleString()} />
        <StatCard label="已支付" value={stats.orders.paid.toLocaleString()} success />
      </Section>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, color, children }) => (
  <div className="dashboard-section">
    <div className="section-header">
      <span className="section-icon">{icon}</span>
      <h2 className="section-title">{title}</h2>
      <div className="section-accent" style={{ background: color }} />
    </div>
    <div className="section-cards">{children}</div>
  </div>
);

interface StatCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
  danger?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, highlight, success, danger }) => {
  const borderColor = success ? "#10b981" : danger ? "#ef4444" : highlight ? "#f472b6" : "transparent";
  return (
    <div className={`stat-card${highlight ? " highlight" : ""}${success ? " success" : ""}${danger ? " danger" : ""}`} style={{ borderTop: `3px solid ${borderColor}` }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
};

export default Dashboard;

