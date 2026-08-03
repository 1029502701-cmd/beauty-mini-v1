import React from "react";
import "./CreatorPlaceholder.css";

interface KOL {
  id: string;
  name: string;
  avatar?: string;
  intro: string;
}

interface CreatorPlaceholderProps {
  kols: KOL[];
}

const CreatorPlaceholder = ({ kols }: CreatorPlaceholderProps) => {
  return (
    <div className="creator-placeholder">
      <h3>达人推荐</h3>
      {kols.length > 0 ? (
        <div className="kol-list">
          {kols.slice(0, 2).map((kol, index) => (
            <div key={kol.id} className="kol-item">
              <div className="kol-rank">TOP {index + 1}</div>
              {kol.avatar && (
                <div className="kol-avatar">
                  <img src={kol.avatar} alt={kol.name} />
                </div>
              )}
              <div className="kol-info">
                <div className="kol-name">{kol.name}</div>
                <div className="kol-intro">{kol.intro}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">暂无推荐达人</p>
      )}
      <p className="note">达人功能将在V2版本开放（暂不支持申请和收益系统）</p>
    </div>
  );
};

export default CreatorPlaceholder;