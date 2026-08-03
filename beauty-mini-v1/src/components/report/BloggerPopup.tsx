import React from "react";
import "./BloggerPopup.css";

interface BloggerPopupData {
  id: string;
  name: string;
  avatar: string;
  platform: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  style: string;
  matchScore: number;
  reason: string;
  representativeStyle: string;
}

interface BloggerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  blogger: BloggerPopupData;
}

const getPlatformEmoji = (platform: string): string => {
  const emojis: Record<string, string> = {
    "xiaohongshu": "📱",
    "douyin": "🎵",
    "weibo": "🐦",
    "bilibili": "🎬"
  };
  return emojis[platform] || "✨";
};

const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    "xiaohongshu": "#ff6b6b",
    "douyin": "#667eea",
    "weibo": "#f093fb",
    "bilibili": "#4d96ff"
  };
  return colors[platform] || "#667eea";
};

const BloggerPopup = ({ isOpen, onClose, blogger }: BloggerPopupProps) => {
  if (!isOpen) return null;

  const renderMatchScoreColor = (score: number) => {
    if (score >= 90) return "#28a745";
    if (score >= 75) return "#ffc107";
    if (score >= 60) return "#667eea";
    return "#dc3545";
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="blogger-popup-overlay" onClick={handleBackdropClick}>
      <div className="blogger-popup-content">
        <button className="popup-close-btn" onClick={onClose}>×</button>
        
        <div className="popup-header">
          <h2 className="popup-title">达人详情</h2>
        </div>
        
        <div className="popup-body">
          <div className="blogger-detail">
            <div className="blogger-avatar">
              <img src={blogger.avatar} alt={blogger.name} />
            </div>
            <div className="blogger-info">
              <div className="blogger-name">
                {blogger.name}
                <span className="blogger-platform" style={{ color: getPlatformColor(blogger.platform) }}>
                  {getPlatformEmoji(blogger.platform)} {blogger.platform}
                </span>
              </div>
              <div className="blogger-style">
                <span className="style-label">风格：</span>
                <span className="style-value">{blogger.style}</span>
              </div>
            </div>
          </div>
          
          <div className="blogger-match">
            <span className="match-label">AI匹配度：</span>
            <span className="match-score" style={{ color: renderMatchScoreColor(blogger.matchScore) }}>
              {blogger.matchScore.toFixed(1)}分
            </span>
          </div>
          
          <div className="blogger-reason">
            <span className="reason-label">为什么适合：</span>
            <span className="reason-value">{blogger.reason}</span>
          </div>
          
          <div className="blogger-representative">
            <span className="rep-label">代表风格：</span>
            <span className="rep-value">{blogger.representativeStyle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloggerPopup;