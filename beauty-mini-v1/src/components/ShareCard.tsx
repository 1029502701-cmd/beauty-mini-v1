import React from "react";
import "./ShareCard.css";

interface ShareCardProps {
  onShare: () => void;
}

const ShareCard = ({ onShare }: ShareCardProps) => {
  return (
    <div className="share-card" onClick={onShare}>
      <div className="share-content">
        <div className="share-icon">🎁</div>
        <div className="share-title">生成分享卡</div>
        <div className="share-desc">生成精美报告分享卡，一键分享给朋友</div>
      </div>
    </div>
  );
};

export default ShareCard;
