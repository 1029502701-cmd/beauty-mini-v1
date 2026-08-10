import React from "react";
import "./BeautyProfileCard.css";

interface FacialFeaturesProps {
  eyeShape: string;
  browShape: string;
  lipShape: string;
  faceShape: string;
}

interface BeautyProfileCardProps {
  styleName: string;
  styleDescription: string;
  reportCode?: string;
  facialFeatures: FacialFeaturesProps;
  onFeatureClick?: (feature: string) => void;
}

const BeautyProfileCard = ({ 
  styleName, 
  styleDescription, 
  reportCode, 
  facialFeatures,
  onFeatureClick 
}: BeautyProfileCardProps) => {
  const handleFeatureClick = (feature: string) => {
    onFeatureClick?.(feature);
  };

  return (
    <div className="beauty-profile-card">
      <div className="card-header">
        <h3>? AI美妆分析报告</h3>
        {reportCode && <span className="report-code">{reportCode}</span>}
      </div>

      <div className="makeup-style-section">
        <div className="style-label">您的美妆定位</div>
        <div className="style-value" onClick={() => handleFeatureClick(styleName)} style={{ cursor: 'pointer' }}>
          {styleName}
        </div>
        <div className="style-description">{styleDescription}</div>
      </div>

      <div className="divider"></div>

      <div className="advantage-section">
        <h4>五官优势</h4>
        <div className="advantages-list">
          <div 
            className="advantage-item clickable"
            onClick={() => handleFeatureClick(facialFeatures.eyeShape)}
            style={{ cursor: 'pointer' }}
          >
            <span className="advantage-icon">?</span>
            <span className="advantage-text">眉眼柔和 - {facialFeatures.eyeShape}</span>
          </div>
          <div 
            className="advantage-item clickable"
            onClick={() => handleFeatureClick(facialFeatures.browShape)}
            style={{ cursor: 'pointer' }}
          >
            <span className="advantage-icon">?</span>
            <span className="advantage-text">眉形自然 - {facialFeatures.browShape}</span>
          </div>
          <div 
            className="advantage-item clickable"
            onClick={() => handleFeatureClick(facialFeatures.lipShape)}
            style={{ cursor: 'pointer' }}
          >
            <span className="advantage-icon">?</span>
            <span className="advantage-text">唇部清晰 - {facialFeatures.lipShape}</span>
          </div>
          <div 
            className="advantage-item clickable"
            onClick={() => handleFeatureClick(facialFeatures.faceShape)}
            style={{ cursor: 'pointer' }}
          >
            <span className="advantage-icon">?</span>
            <span className="advantage-text">脸型匀称 - {facialFeatures.faceShape}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeautyProfileCard;
