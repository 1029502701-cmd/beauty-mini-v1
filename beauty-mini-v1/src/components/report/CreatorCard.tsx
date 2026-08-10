import React from "react";
import "./CreatorCard.css";
import type { CreatorRecommendation } from "@/types/beauty";

interface CreatorCardProps {
  creator: CreatorRecommendation;
  onClick?: () => void;
}

interface ScoreBadgeProps {
  score: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
  weibo: "微博",
  bilibili: "B站"
};

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  const color = score >= 85 ? "#e91e63" : score >= 70 ? "#ff9800" : "#9e9e9e";
  const label = score >= 85 ? "高度匹配" : score >= 70 ? "良好匹配" : "一般匹配";
  return (
    <span className="match-score-badge" style={{ color, background: color + "18", border: `1px solid ${color}40` }}>
      {score}% {label}
    </span>
  );
};

const CreatorCard: React.FC<CreatorCardProps> = ({ creator, onClick }) => {
  const platformLabel = creator.platform ? PLATFORM_LABELS[creator.platform] : "";

  return (
    <div className="creator-card" onClick={onClick}>
      <div className="creator-avatar">
        {creator.avatar ? (
          <img src={creator.avatar} alt={creator.name} className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">👤</div>
        )}
      </div>
      <div className="creator-info">
        <div className="creator-header">
          <span className="creator-name">{creator.name}</span>
          {platformLabel && <span className="platform-badge">{platformLabel}</span>}
          {creator.matchScore != null && (
            <ScoreBadge score={creator.matchScore} />
          )}
        </div>
        {creator.suitableStyle && (
          <div className="creator-suitable-style">
            <span className="suitable-label">适合风格</span>
            <span className="suitable-value">{creator.suitableStyle}</span>
          </div>
        )}
        <div className="creator-desc">{creator.description}</div>
        {creator.matchReasons && creator.matchReasons.length > 0 && (
          <div className="creator-reasons">
            {creator.matchReasons.map((r, i) => (
              <div key={i} className="reason-item">
                <span className="reason-dot">●</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
        {creator.styleTags.length > 0 && (
          <div className="creator-tags">
            {creator.styleTags.map((tag, i) => (
              <span key={i} className="style-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="creator-hint">点击查看 ›</div>
    </div>
  );
};

export default CreatorCard;