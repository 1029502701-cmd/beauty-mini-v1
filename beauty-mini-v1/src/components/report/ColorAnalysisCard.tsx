import React from "react";
import "./ColorAnalysisCard.css";
import type { ColorAnalysisContent } from "@/types/beauty";

interface ColorAnalysisCardProps {
  content: ColorAnalysisContent;
}

const SKIN_TONE_LABELS: Record<string, string> = {
  warm: "暖色调",
  cool: "冷色调",
  neutral: "中性色调",
  olive: "橄榄色调"
};

const SKIN_TONE_EMOJI: Record<string, string> = {
  warm: "??",
  cool: "??",
  neutral: "??",
  olive: "??"
};

const ColorAnalysisCard: React.FC<ColorAnalysisCardProps> = ({ content }) => {
  const toneLabel = SKIN_TONE_LABELS[content.skinToneCategory] || content.skinToneCategory;
  const toneEmoji = SKIN_TONE_EMOJI[content.skinToneCategory] || "?";

  return (
    <div className="color-analysis-card section-block">
      <div className="section-anchor">
        <span className="anchor-num">03</span>
        <span className="anchor-label">色彩分析</span>
      </div>

      <div className="color-main">
        <div className="color-tone-indicator">
          <span className="tone-emoji">{toneEmoji}</span>
          <div className="tone-info">
            <div className="tone-category">{toneLabel}</div>
            <div className="tone-desc">您的专属色彩季型</div>
          </div>
        </div>
      </div>

      <div className="color-palette-section">
        <span className="palette-label">推荐色系</span>
        <div className="color-palette">
          {content.recommendedPalette.map((color, i) => (
            <span key={i} className="color-swatch">{color}</span>
          ))}
        </div>
      </div>

      {content.avoidColors.length > 0 && (
        <div className="color-avoid-section">
          <span className="avoid-label">建议避开</span>
          <div className="color-avoid">
            {content.avoidColors.map((color, i) => (
              <span key={i} className="avoid-swatch">{color}</span>
            ))}
          </div>
        </div>
      )}

      {content.foundationTip && (
        <div className="foundation-tip">
          <span className="tip-icon">??</span>
          <span className="tip-text">{content.foundationTip}</span>
        </div>
      )}
    </div>
  );
};

export default ColorAnalysisCard;
