import React from "react";
import "./CreatorCard.css";

interface BeautyCreator {
  id: string;
  name: string;
  avatar: string;
  platform: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  description: string;
  styleTags: string[];
  works: string[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface CreatorCardProps {
  creator: BeautyCreator;
  rank?: number;
}

const CreatorCard = ({ creator, rank = 0 }: CreatorCardProps) => {
  const platformNames: Record<string, string> = {
    xiaohongshu: "小红书",
    douyin: "抖音",
    weibo: "微博",
    bilibili: "B站"
  };

  return (
    <div className="creator-card">
      <div className="creator-header">
        {rank > 0 && (
          <div className="creator-rank">
            TOP {rank}
          </div>
        )}
        <img src={creator.avatar} alt={creator.name} className="creator-avatar" />
        <div className="creator-info">
          <div className="creator-name">
            {creator.name}
            {creator.status === "pending" && (
              <span className="status-badge pending">审核中</span>
            )}
            {creator.status === "approved" && (
              <span className="status-badge approved">已认证</span>
            )}
          </div>
          <div className="creator-platform">
            {platformNames[creator.platform]}
          </div>
        </div>
      </div>
      
      <div className="creator-description">
        {creator.description}
      </div>

      <div className="creator-styles">
        <strong>擅长风格：</strong>
        {creator.styleTags.map((tag, idx) => (
          <span key={idx} className="style-tag">{tag}</span>
        ))}
      </div>

      <div className="creator-reason">
        <strong>推荐理由：</strong>{creator.reason}
      </div>

      <div className="creator-works">
        作品预览：
        {creator.works.slice(0, 3).map((work, idx) => (
          <img key={idx} src={work} alt={"" + (idx + 1)} className="work-preview" />
        ))}
        {creator.works.length > 3 && <span className="work-count">+{creator.works.length - 3}</span>}
      </div>
    </div>
  );
};

export default CreatorCard;
