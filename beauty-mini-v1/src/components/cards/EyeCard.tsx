import React from "react";
import "./EyeCard.css";

interface EyeCardProps {
  eyeType: string;
  recommendedMakeup: string;
  onViewSuitableProducts: () => void;
}

const EyeCard = ({ eyeType, recommendedMakeup, onViewSuitableProducts }: EyeCardProps) => {
  return (
    <div className="eye-card">
      <div className="card-header">
        <h3 className="card-title">眼妆分析</h3>
      </div>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">眼型分析：</span>
          <span className="info-value">{eyeType || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">推荐眼妆：</span>
          <span className="info-value" style={{ color: "#667eea" }}>{recommendedMakeup || "待推荐"}</span>
        </div>
      </div>
      <button className="action-btn" onClick={onViewSuitableProducts}>
        查看适合商品
      </button>
    </div>
  );
};

export default EyeCard;
