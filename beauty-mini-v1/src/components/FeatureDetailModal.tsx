import React from "react";
import "./FeatureDetailModal.css";

interface FeatureDetailData {
  title: string;
  feature: string;
  description: string;
  suitable?: string[];
  recommendations?: string[];
}

interface FeatureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FeatureDetailData | null;
}

const FeatureDetailModal = ({ isOpen, onClose, data }: FeatureDetailModalProps) => {
  if (!isOpen || !data) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="feature-modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="feature-modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <h2 className="modal-title">{data.title}</h2>
        
        <div className="modal-feature">
          <span className="feature-label">特征：</span>
          <span className="feature-value">{data.feature}</span>
        </div>
        
        <div className="modal-section">
          <div className="section-header">详细说明</div>
          <div className="section-content">{data.description}</div>
        </div>
        
        {data.suitable && data.suitable.length > 0 && (
          <div className="modal-section">
            <div className="section-header">适合建议</div>
            <div className="section-content">
              {data.suitable.map((item, index) => (
                <div key={index} className="suitable-item">• {item}</div>
              ))}
            </div>
          </div>
        )}
        
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="modal-section">
            <div className="section-header">推荐方向</div>
            <div className="section-content">
              {data.recommendations.map((item, index) => (
                <div key={index} className="recommendation-item">✓ {item}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureDetailModal;