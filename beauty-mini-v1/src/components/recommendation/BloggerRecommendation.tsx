import React from "react";
import RecommendationCard from "./RecommendationCard";
import "./BloggerRecommendation.css";

interface BloggerMatchData {
  id: string;
  name: string;
  avatar?: string;
  platform?: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  matchScore: number;
  styleTags: string[];
  reason: string;
  intro: string;
}

interface BloggerRecommendationProps {
  bloggers: BloggerMatchData[];
  onBloggerClick?: (blogger: BloggerMatchData) => void;
}

const getPlatformEmoji = (platform?: string): string => {
  const emojis = {
    "xiaohongshu": "📱",
    "douyin": "🎵",
    "weibo": "🐦",
    "bilibili": "🎬"
  };
  return emojis[platform || ""] || "✨";
};

const BloggerRecommendation = ({ bloggers, onBloggerClick }: BloggerRecommendationProps) => {
  if (bloggers.length === 0) {
    return null;
  }

  const renderBlogger = (blogger: BloggerMatchData, index: number) => {
    const tags = blogger.styleTags.map(tag => ({
      category: tag.includes("眼") ? "eye" : 
                tag.includes("唇") ? "lip" : 
                tag.includes("肤") ? "skincare" : "general",
      label: tag
    }));

    return (
      <div key={blogger.id} className="blogger-item-wrapper">
        <RecommendationCard
          title={blogger.name + " 达人匹配"}
          matchScore={{ score: blogger.matchScore, label: "匹配度" }}
          tags={tags}
          reason={blogger.reason}
        >
          <div className="blogger-item" onClick={() => onBloggerClick?.(blogger)}>
            <div className="blogger-header">
              <div className="blogger-rank">TOP {index + 1}</div>
              {blogger.avatar && (
                <div className="blogger-avatar">
                  <img src={blogger.avatar} alt={blogger.name} />
                </div>
              )}
              <div className="blogger-info">
                <div className="blogger-name">
                  {blogger.name}
                  <span className="blogger-platform">{getPlatformEmoji(blogger.platform)}</span>
                </div>
                <div className="blogger-intro">{blogger.intro || "暂无简介"}</div>
              </div>
            </div>
          </div>
        </RecommendationCard>
      </div>
    );
  };

  return (
    <div className="blogger-recommendation">
      <h3 className="section-title">达人推荐</h3>
      {bloggers.map((blogger, index) => renderBlogger(blogger, index))}
    </div>
  );
};

export default BloggerRecommendation;
