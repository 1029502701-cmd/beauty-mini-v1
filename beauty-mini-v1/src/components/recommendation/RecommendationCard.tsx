import React from "react";
import "./RecommendationCard.css";

interface MatchScoreProps {
  score: number;
  label: string;
}

interface RecommendationTag {
  category: string;
  label: string;
}

interface RecommendationCardProps {
  title: string;
  matchScore: MatchScoreProps;
  tags?: RecommendationTag[];
  reason?: string;
  className?: string;
}

const RecommendationCard = ({ title, matchScore, tags = [], reason, className = "" }: RecommendationCardProps) => {
  const renderMatchScore = () => {
    const { score, label } = matchScore;
    let scoreColor = "#667eea";
    let scoreBg = "rgba(102, 126, 234, 0.1)";
    if (score >= 90) {
      scoreColor = "#28a745";
      scoreBg = "rgba(40, 167, 69, 0.1)";
    } else if (score >= 75) {
      scoreColor = "#ffc107";
      scoreBg = "rgba(255, 193, 7, 0.1)";
    } else if (score >= 60) {
      scoreColor = "#667eea";
      scoreBg = "rgba(102, 126, 234, 0.1)";
    } else {
      scoreColor = "#dc3545";
      scoreBg = "rgba(220, 53, 69, 0.1)";
    }
    return (
      <div className="match-score-card" style={{ backgroundColor: scoreBg, borderLeft: "4px solid " + scoreColor }}>
        <div className="match-score-label">{label}</div>
        <div className="match-score-value">{score.toFixed(1)}分</div>
      </div>
    );
  };

  var classNameStr = "recommendation-card " + className;
  return (
    <div className={classNameStr}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      {renderMatchScore()}
      {tags.length > 0 && (
        <div className="tags-section">
          <div className="tags-title">风格匹配标签</div>
          <div className="tags-grid">
            {tags.map((tag, i) => (
              <span key={i} className="tag-badge" style={{ backgroundColor: "#c8a2c833", color: "#333" }}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {reason && (
        <div className="reason-section">
          <div className="reason-label">匹配理由：</div>
          <div className="reason-value">{reason}</div>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
