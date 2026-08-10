import React from "react";
import "./FaceAnalysisCard.css";

interface FaceAnalysisCardProps {
  faceShape: string;
  facialFeatures: Record<string, any>;
  onViewSuitablePlan: () => void;
}

const FaceAnalysisCard = ({ faceShape, facialFeatures, onViewSuitablePlan }: FaceAnalysisCardProps) => {
  return (
    <div className="face-analysis-card">
      <div className="card-header">
        <h3 className="card-title">面容分析</h3>
      </div>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">脸型：</span>
          <span className="info-value">{faceShape || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">眼型：</span>
          <span className="info-value">{facialFeatures.eyeShape || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">眉型：</span>
          <span className="info-value">{facialFeatures.browShape || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">唇形：</span>
          <span className="info-value">{facialFeatures.lipShape || "未分析"}</span>
        </div>
        <div className="info-item">
          <span className="info-label">面部特点：</span>
          <span className="info-value">{facialFeatures.description || "待补充"}</span>
        </div>
      </div>
      <button className="action-btn" onClick={onViewSuitablePlan}>
        查看适合方案
      </button>
    </div>
  );
};

export default FaceAnalysisCard;
