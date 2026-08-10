import React from "react";
import "./FaceAnalysisCard.css";
import type { FaceAnalysisContent } from "@/types/beauty";

interface FaceAnalysisCardProps {
  content: FaceAnalysisContent;
  faceShape?: string;
  skinType?: string;
  oilLevel?: number;
  hydrationLevel?: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#e91e63",
  medium: "#ff9800",
  low: "#9e9e9e"
};

const FaceAnalysisCard: React.FC<FaceAnalysisCardProps> = ({
  content,
  faceShape,
  skinType,
  oilLevel,
  hydrationLevel
}) => {
  const faceShapeDisplay = faceShape || content.faceShape || "鹅蛋脸";
  const symmetryPercent = Math.round(content.symmetryScore * 100);

  return (
    <div className="face-analysis-card section-block">
      <div className="section-anchor">
        <span className="anchor-num">01</span>
        <span className="anchor-label">脸型分析</span>
      </div>

      <div className="face-main-stats">
        <div className="face-stat-item">
          <div className="face-stat-label">脸型</div>
          <div className="face-stat-value">{faceShapeDisplay}</div>
        </div>
        <div className="face-stat-item">
          <div className="face-stat-label">对称度</div>
          <div className="face-stat-value">{symmetryPercent}%</div>
        </div>
        <div className="face-stat-item">
          <div className="face-stat-label">比例</div>
          <div className="face-stat-value">{content.faceRatio.toFixed(2)}</div>
        </div>
      </div>

      <p className="face-description">{content.description}</p>

      {skinType && (
        <div className="face-skin-info">
          <span className="skin-tag">{skinType}</span>
          {oilLevel !== undefined && (
            <span className="skin-tag oil-tag">油性 {oilLevel}%</span>
          )}
          {hydrationLevel !== undefined && (
            <span className="skin-tag hydrate-tag">保湿 {hydrationLevel}%</span>
          )}
        </div>
      )}

      {content.highlightPoints.length > 0 && (
        <div className="face-highlights">
          <span className="highlights-label">五官亮点</span>
          <div className="highlights-list">
            {content.highlightPoints.map((point, i) => (
              <span key={i} className="highlight-tag">
                {point}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceAnalysisCard;
