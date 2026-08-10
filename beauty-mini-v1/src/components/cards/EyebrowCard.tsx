import React from "react";
import "./EyebrowCard.css";

interface EyebrowCardProps {
  currentShape: string;
  recommendedShape: string;
  onViewRecommendProducts: () => void;
}

const EyebrowCard = ({ currentShape, recommendedShape, onViewRecommendProducts }: EyebrowCardProps) => {
  return (
    <div className="eyebrow-card">
      <div className="card-header">
        <h3 className="card-title">眉毛分析</h3>
      </div>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">当前眉型：</span>
          <span className="info-value">{currentShape || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">推荐眉型：</span>
          <span className="info-value" style={{ color: "#667eea" }}>{recommendedShape || "待推荐"}</span>
        </div>
      </div>
      <button className="action-btn" onClick={onViewRecommendProducts}>
        查看推荐商品
      </button>
    </div>
  );
};

export default EyebrowCard;
