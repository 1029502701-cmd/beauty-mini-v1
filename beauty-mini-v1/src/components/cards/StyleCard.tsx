import React from "react";
import "./StyleCard.css";

interface StyleCardProps {
  style: string;
  onViewReferBlogger: () => void;
}

const StyleCard = ({ style, onViewReferBlogger }: StyleCardProps) => {
  return (
    <div className="style-card">
      <div className="card-header">
        <h3 className="card-title">整体风格</h3>
      </div>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">美妆定位：</span>
          <span className="info-value">{style || "未分析"}</span>
        </div>
      </div>
      <button className="action-btn" onClick={onViewReferBlogger}>
        查看参考达人
      </button>
    </div>
  );
};

export default StyleCard;
