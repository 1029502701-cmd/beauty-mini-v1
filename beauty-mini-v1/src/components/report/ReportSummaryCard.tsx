import React from "react";
import "./ReportSummaryCard.css";

interface ReportSummaryCardProps {
  faceShape: string;
  eyeShape: string;
  styleName: string;
  coreSuggestions: string[];
  reportCode: string;
  createdAt: string;
}

const ReportSummaryCard: React.FC<ReportSummaryCardProps> = ({
  faceShape,
  eyeShape,
  styleName,
  coreSuggestions,
  reportCode,
  createdAt,
}) => {
  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="report-summary-card">
      <div className="summary-header">
        <div className="summary-title-group">
          <span className="summary-label">AI 分析摘要</span>
          <span className="summary-code">#{reportCode}</span>
        </div>
        <span className="summary-date">{formatDate(createdAt)}</span>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-icon">🪞</div>
          <div className="summary-item-content">
            <span className="summary-item-label">我的脸型</span>
            <span className="summary-item-value">{faceShape || "待分析"}</span>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-icon">👁️</div>
          <div className="summary-item-content">
            <span className="summary-item-label">眼型特点</span>
            <span className="summary-item-value">{eyeShape || "待分析"}</span>
          </div>
        </div>
        <div className="summary-item full-width">
          <div className="summary-icon">✨</div>
          <div className="summary-item-content">
            <span className="summary-item-label">适合方向</span>
            <span className="summary-item-value">{styleName || "清透自然型"}</span>
          </div>
        </div>
      </div>

      {coreSuggestions.length > 0 && (
        <div className="summary-suggestions">
          <span className="suggestions-label">核心建议</span>
          <div className="suggestions-list">
            {coreSuggestions.map((s, i) => (
              <span key={i} className="suggestion-tag">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSummaryCard;
