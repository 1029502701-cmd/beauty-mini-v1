import React from "react";
import "./LipCard.css";

interface LipCardProps {
  lipShape: string;
  recommendedColor: string;
  onViewRecommendProducts: () => void;
}

const LipCard = ({ lipShape, recommendedColor, onViewRecommendProducts }: LipCardProps) => {
  return (
    <div className="lip-card">
      <div className="card-header">
        <h3 className="card-title">唇部分析</h3>
      </div>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">唇形分析：</span>
          <span className="info-value">{lipShape || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">推荐唇色：</span>
          <span className="info-value" style={{ color: "#f8b4b4" }}>{recommendedColor || "待推荐"}</span>
        </div>
      </div>
      <button className="action-btn" onClick={onViewRecommendProducts}>
        查看推荐商品
      </button>
    </div>
  );
};

export default LipCard;
