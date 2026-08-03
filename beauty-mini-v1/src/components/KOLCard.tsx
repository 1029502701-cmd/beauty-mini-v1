import React from "react";
import "./KOLCard.css";

interface KOLData {
  id: string;
  name: string;
  avatar?: string;
  intro: string;
  platform?: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  styleTags?: string[];
  recommendCount?: number;
}

interface KOLCardProps {
  kols: KOLData[];
}

const KOLCard = ({ kols }: KOLCardProps) => {
  const getPlatformName = (platform?: string): string => {
    const names: Record<string, string> = {
      "xiaohongshu": "小红书",
      "douyin": "抖音",
      "weibo": "微博",
      "bilibili": "B站"
    };
    return names[platform || ""] || "达人";
  };

  return (
    <div className="kol-card">
      <h3 className="card-title">达人推荐</h3>
      <div className="kol-top2">
        {kols.slice(0, 2).map((kol, index) => (
          <div key={kol.id} className="kol-item">
            <div className="kol-rank">TOP {index + 1}</div>
            {kol.avatar && (
              <div className="kol-avatar">
                <img src={kol.avatar} alt={kol.name} />
              </div>
            )}
            <div className="kol-info">
              <div className="kol-name">
                {kol.name}
                {kol.recommendCount && (
                  <span className="recommend-count">({kol.recommendCount}次推荐)</span>
                )}
              </div>
              <div className="kol-platform">{getPlatformName(kol.platform)}</div>
              <div className="kol-intro">{kol.intro}</div>
              {kol.styleTags && kol.styleTags.length > 0 && (
                <div className="kol-tags">
                  {kol.styleTags.map((tag, i) => (
                    <span key={i} className="tag-badge">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KOLCard;
