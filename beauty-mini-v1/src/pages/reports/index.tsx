import React, { useState, useEffect, useCallback } from "react";
import { navigate } from "@taro/router";
import { Button, Text, View } from '@tarojs/components';
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
      <View className="reports-page reports-loading">
        <View className="loading-content">
          <View className="loading-icon">📋</View>
          <Text>加载报告中...</Text>
          <View className="loading-dots">
            <Text className="dot" /><Text className="dot" /><Text className="dot" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="reports-page">
      <View className="reports-header">
        <Text className="reports-title">我的报告</Text>
        <Text className="reports-subtitle">
          {reports.length > 0 ? `${reports.length} 份分析报告` : "暂无分析报告"}
        </Text>
      </View>

      {/* Task 5: Level Filter */}
      <View className="level-filter-bar">
        {LEVEL_FILTERS.map((f) => (
          <Button
            key={f.key}
            className={"level-filter-btn" + (activeFilter === f.key ? " active" : "")}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </View>

      <View className="reports-body">
        {filteredReports.length === 0 && !error ? (
          <View className="empty-state">
            <View className="empty-icon">📝</View>
            <Text>暂无分析报告</Text>
            <Text>上传照片进行 AI 美学分析，生成你的专属美妆报告</Text>
            <Button className="start-btn btn-center" onClick={() => navigate("/pages/upload")}>
              开始分析
            </Button>
          </View>
        ) : filteredReports.length === 0 && error ? (
          <View className="empty-state">
            <View className="empty-icon">⚠️</View>
            <Text>加载失败</Text>
            <Text className="error-text">{error}</Text>
            <Button className="retry-btn btn-center" onClick={fetchReports}>重新加载</Button>
            <Button className="back-btn btn-center" onClick={() => navigate("/pages/home")}>返回首页</Button>
          </View>
        ) : (
          <View className="reports-list">
            {filteredReports.map((report) => (
              <View
                key={report.reportId}
                className="report-card"
                onClick={() => handleReportClick(report.reportId)}
              >
                <View className="report-card-header">
                  <Text className="report-code">{report.reportCode || report.reportId}</Text>
                  <Text className="report-time">{formatRelativeTime(report.createdAt)}</Text>
                </View>
                <View className="report-card-meta">
                  <Text className="report-level">
                    {LEVEL_ICONS[report.level || "first-look"]}{" "}
                    {LEVEL_NAMES[report.level || "first-look"] || "初见妆容"}
                  </Text>
                  {report.styleName && (
                    <Text className="report-style">{report.styleName}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="reports-footer">
        <Button className="nav-btn btn-center" onClick={() => navigate("/pages/home")}>
          <Text className="nav-icon">🏠</Text>
          <Text>首页</Text>
        </Button>
        <Button className="nav-btn nav-btn--active" onClick={() => navigate("/pages/upload")}>
          <Text className="nav-icon">✨</Text>
          <Text>新分析</Text>
        </Button>
        <Button className="nav-btn btn-center" onClick={() => navigate("/pages/profile")}>
          <Text className="nav-icon">👤</Text>
          <Text>我的</Text>
        </Button>
      </View>
    </View>
  );
};

export default Index;


