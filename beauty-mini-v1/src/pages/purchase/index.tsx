import React from "react";
import { navigate } from "@taro/router";
import "./index.css";

const LEVELS = [
  {
    id: "style-upgrade",
    name: "风格进阶",
    tag: "进阶分析",
    icon: "🌿",
    price: "0 Token",
    desc: "解锁色彩分析、专业妆容建议",
    features: ["色彩分析", "妆容建议升级"],
    current: false,
  },
  {
    id: "beauty-pro",
    name: "专属美学",
    tag: "私人定制",
    icon: "👑",
    price: "3 Token",
    desc: "完整美妆方案、产品推荐、达人匹配",
    features: ["完整妆容方案", "产品推荐", "达人匹配", "30天保存"],
    current: true,
    recommended: true,
  },
];

const Index = () => {
  const handleBack = () => {
    navigate("/pages/home");
  };

  const handleBuy = (levelId: string) => {
    // Placeholder: navigate to token page for now
    navigate("/pages/token");
  };

  return (
    <div className="purchase-page">
      <header className="purchase-header">
        <button className="back-btn btn-center" onClick={handleBack}>‹</button>
        <h1 className="page-title">购买报告</h1>
        <div className="header-spacer" />
      </header>

      <div className="purchase-body">
        <p className="page-desc">选择适合的报告等级，解锁更多AI美学分析内容</p>

        <div className="level-cards">
          {LEVELS.map((level) => (
            <div key={level.id} className={"level-card" + (level.recommended ? " recommended" : "")}>
              {level.recommended && <span className="recommended-badge">推荐</span>}
              <div className="level-card-header">
                <span className="level-card-icon">{level.icon}</span>
                <div className="level-card-info">
                  <span className="level-card-name">{level.name}</span>
                  <span className="level-card-tag">{level.tag}</span>
                </div>
              </div>
              <p className="level-card-desc">{level.desc}</p>
              <ul className="level-features">
                {level.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <div className="level-card-price">{level.price}</div>
              <button
                className="buy-btn"
                onClick={() => handleBuy(level.id)}
                disabled={level.current}
              >
                {level.current ? "当前等级" : "立即购买"}
              </button>
            </div>
          ))}
        </div>

        <div className="purchase-note">
          <p>💡 提示：Token 将在解锁后自动扣减，报告数据保留对应等级有效期。</p>
        </div>
      </div>
    </div>
  );
};

export default Index;

