import React from "react";
import "./MakeupSuggestionCard.css";
import type { MakeupStyleContent } from "@/types/beauty";

interface MakeupSuggestionCardProps {
  content: MakeupStyleContent;
  suggestions?: string[];
}

const MAKEUP_ICONS: Record<string, string> = {
  daily: "??",
  formal: "??",
  evening: "??",
  special: "?"
};

const OCCASION_LABELS: Record<string, string> = {
  daily: "日常",
  formal: "正式",
  evening: "晚宴",
  special: "特别"
};

const MakeupSuggestionCard: React.FC<MakeupSuggestionCardProps> = ({ content, suggestions }) => {
  const icon = MAKEUP_ICONS[content.occasion] || "?";
  const occasionLabel = OCCASION_LABELS[content.occasion] || content.occasion;
  const confidencePercent = Math.round(content.confidence * 100);

  return (
    <div className="makeup-suggestion-card section-block">
      <div className="section-anchor">
        <span className="anchor-num">02</span>
        <span className="anchor-label">妆容建议</span>
      </div>

      <div className="makeup-primary">
        <div className="makeup-icon">{icon}</div>
        <div className="makeup-info">
          <div className="makeup-primary-style">{content.primaryStyle}</div>
          <div className="makeup-occasion">
            <span className="occasion-badge">{occasionLabel}</span>
            <span className="confidence-badge">置信 {confidencePercent}%</span>
          </div>
        </div>
      </div>

      {content.secondaryStyles.length > 0 && (
        <div className="makeup-secondary">
          <span className="secondary-label">适配风格</span>
          <div className="secondary-tags">
            {content.secondaryStyles.map((style, i) => (
              <span key={i} className="secondary-tag">{style}</span>
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="makeup-tips">
          <span className="tips-label">核心建议</span>
          <ul className="tips-list">
            {suggestions.map((tip, i) => (
              <li key={i} className="tip-item">
                <span className="tip-bullet">?</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MakeupSuggestionCard;
