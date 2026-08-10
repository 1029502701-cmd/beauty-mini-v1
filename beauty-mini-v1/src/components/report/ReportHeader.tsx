import React from "react";
import LevelBadge from "./LevelBadge";
import "./ReportHeader.css";
import type { ReportLevel } from "@/types/report-level";

interface ReportHeaderProps {
  level: ReportLevel;
  reportCode: string;
  createdAt: string;
}

const LEVEL_NAME: Record<ReportLevel, string> = {
  "first-look": "初见妆容",
  "style-upgrade": "风格进阶",
  "beauty-pro": "专属美学"
};

const LEVEL_DESC: Record<ReportLevel, string> = {
  "first-look": "基础脸型分析与妆容建议",
  "style-upgrade": "色彩与风格方向深度解读",
  "beauty-pro": "专属美学方案与产品达人推荐"
};

const ReportHeader: React.FC<ReportHeaderProps> = ({ level, reportCode, createdAt }) => {
  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="report-header">
      <div className="report-header-top">
        <div className="report-header-brand">
          <span className="brand-icon">💄</span>
          <span className="brand-text">AI 美妆报告</span>
        </div>
        <LevelBadge level={level} levelName={LEVEL_NAME[level]} />
      </div>
      <div className="report-header-meta">
        <span className="report-code">编号 #{reportCode}</span>
        <span className="report-date">{formatDate(createdAt)}</span>
      </div>
      <p className="report-header-desc">{LEVEL_DESC[level]}</p>
    </div>
  );
};

export default ReportHeader;
