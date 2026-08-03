import React, { useState, useEffect, useCallback } from "react";
import { navigate } from "@taro/router";
import "./index.css";
import { getReports } from "../../services/api";
import { getStorage } from "../../utils/storage";
import type { ReportSummary } from "../../types";

const LOCAL_REPORTS_KEY = "beauty_reports_list";

const LEVEL_ICONS: Record<string, string> = {
  "first-look": "🌸",
  "style-upgrade": "🌿",
  "beauty-pro": "👑",
};

const LEVEL_NAMES: Record<string, string> = {
  "first-look": "初见妆容",
  "style-upgrade": "风格进阶",
  "beauty-pro": "专属美学",
};

const LEVEL_FILTERS = [
  { key: "all", label: "全部" },
  { key: "first-look", label: "免费" },
  { key: "style-upgrade", label: "进阶" },
  { key: "beauty-pro", label: "专业" },
];

interface ReportSummaryWithLevel extends ReportSummary {
  level?: string;
}

const Index = () => {
  const [reports, setReports] = useState<ReportSummaryWithLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getReports();
      if (result.success && result.reports && result.reports.length > 0) {
        setReports(result.reports as ReportSummaryWithLevel[]);
      } else {
        const local = getStorage<ReportSummaryWithLevel[]>(LOCAL_REPORTS_KEY);
        if (local && local.length > 0) {
          setReports(local);
        } else {
          setReports([]);
        }
      }
    } catch (err) {
      console.error("[Reports] fetch error:", err);
      const local = getStorage<ReportSummaryWithLevel[]>(LOCAL_REPORTS_KEY);
      if (local && local.length > 0) {
        setReports(local);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReportClick = (reportId: string) => {
    navigate("/pages/result?reportId=" + reportId);
  };

  const formatRelativeTime = (isoStr: string): string => {
    try {
      const now = new Date();
      const date = new Date(isoStr);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "今天";
      if (diffDays === 1) return "昨天";
      if (diffDays < 7) return diffDays + "天前";
      if (diffDays < 30) return Math.floor(diffDays / 7) + "周前";
      return Math.floor(diffDays / 30) + "个月前";
    } catch {
      return isoStr;
    }
  };

  const filteredReports = activeFilter === "all"
    ? reports
    : reports.filter((r) => r.level === activeFilter);

  if (loading) {
    return (
      <div className="reports-page reports-loading">
        <div className="loading-content">
          <div className="loading-icon">📋</div>
          <h2>加载报告中...</h2>
          <div className="loading-dots">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1 className="reports-title">我的报告</h1>
        <p className="reports-subtitle">
          {reports.length > 0 ? `${reports.length} 份分析报告` : "暂无分析报告"}
        </p>
      </header>

      {/* Task 5: Level Filter */}
      <div className="level-filter-bar">
        {LEVEL_FILTERS.map((f) => (
          <button
            key={f.key}
            className={"level-filter-btn" + (activeFilter === f.key ? " active" : "")}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="reports-body">
        {filteredReports.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>暂无分析报告</h2>
            <p>上传照片进行 AI 美学分析，生成你的专属美妆报告</p>
            <button className="start-btn btn-center" onClick={() => navigate("/pages/upload")}>
              开始分析
            </button>
          </div>
        ) : filteredReports.length === 0 && error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h2>加载失败</h2>
            <p className="error-text">{error}</p>
            <button className="retry-btn btn-center" onClick={fetchReports}>重新加载</button>
            <button className="back-btn btn-center" onClick={() => navigate("/pages/home")}>返回首页</button>
          </div>
        ) : (
          <div className="reports-list">
            {filteredReports.map((report) => (
              <div
                key={report.reportId}
                className="report-card"
                onClick={() => handleReportClick(report.reportId)}
              >
                <div className="report-card-header">
                  <span className="report-code">{report.reportCode || report.reportId}</span>
                  <span className="report-time">{formatRelativeTime(report.createdAt)}</span>
                </div>
                <div className="report-card-meta">
                  <span className="report-level">
                    {LEVEL_ICONS[report.level || "first-look"]}{" "}
                    {LEVEL_NAMES[report.level || "first-look"] || "初见妆容"}
                  </span>
                  {report.styleName && (
                    <span className="report-style">{report.styleName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reports-footer">
        <button className="nav-btn btn-center" onClick={() => navigate("/pages/home")}>
          <span className="nav-icon">🏠</span>
          <span>首页</span>
        </button>
        <button className="nav-btn nav-btn--active" onClick={() => navigate("/pages/upload")}>
          <span className="nav-icon">✨</span>
          <span>新分析</span>
        </button>
        <button className="nav-btn btn-center" onClick={() => navigate("/pages/profile")}>
          <span className="nav-icon">👤</span>
          <span>我的</span>
        </button>
      </div>
    </div>
  );
};

export default Index;


