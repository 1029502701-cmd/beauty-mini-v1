import React, { useState, useEffect } from "react";
import "./index.css";
import { navigate } from "@taro/router";
import { getUserQuota } from "../../services/token";
import userService from "../../services/user-service";

const Index = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [freeCount, setFreeCount] = useState(1);

  useEffect(() => {
    async function loadCounts() {
      try {
        const user = await userService.getCurrentUser();
        const quota = getUserQuota(user.userId);
        setFreeCount(quota.freeCount);
        // Count reports created today
        const today = new Date().toDateString();
        const { getStorage } = await import("../../utils/storage");
        const reports = getStorage<Array<{ createdAt: string }>>("beauty_reports_list", []) ?? [];
        const todayReports = reports.filter((r) => new Date(r.createdAt).toDateString() === today);
        setTodayCount(todayReports.length);
      } catch {
        // Use defaults
      }
    }
    loadCounts();
  }, []);

  const handleStartClick = () => {
    navigate({ url: "/pages/upload" });
  };

  const handleProfileClick = () => {
    navigate({ url: "/pages/profile" });
  };

  const handleTokenClick = () => {
    navigate({ url: "/pages/token" });
  };

  const handlePrivacyClick = () => {
    navigate({ url: "/pages/privacy" });
  };

  const handleAgreementClick = () => {
    navigate({ url: "/pages/agreement" });
  };

  const handleReportsClick = () => {
    navigate({ url: "/pages/reports" });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-badge">AI 美学顾问</div>
          <h1 className="hero-title">发现属于你的美</h1>
          <p className="hero-subtitle">
            AI分析你的：<br />
            脸型 · 五官 · 肤色 · 风格
          </p>
          <p className="hero-tagline">生成你的专属美妆建议</p>
          <button className="hero-cta btn-center" onClick={handleStartClick}>
            <span className="cta-icon">✨</span>
            开始AI美学分析
          </button>
        </div>
      </div>

      {/* Today Analysis Count - Task 4 */}
      <div className="section">
        <div className="today-count-card">
          <div className="today-count-icon">📊</div>
          <div className="today-count-info">
            <span className="today-count-label">今日分析次数</span>
            <span className="today-count-value">
              {freeCount - todayCount} / {freeCount} 次免费
            </span>
          </div>
          <div className="today-count-progress">
            <div
              className="today-count-bar"
              style={{ width: `${(todayCount / Math.max(freeCount, 1)) * 100}%` }}
            ></div>
          </div>
          <p className="today-count-hint">
            {todayCount >= freeCount
              ? "今日免费次数已用完，前往 Token 页面获取更多"
              : "剩余免费次数，抓紧体验吧！"}
          </p>
        </div>
      </div>

      {/* Quick Access - My Reports */}
      <div className="section">
        <div className="quick-access-card" onClick={handleReportsClick}>
          <div className="qa-icon">📋</div>
          <div className="qa-content">
            <span className="qa-title">我的报告</span>
            <span className="qa-desc">查看历史分析记录</span>
          </div>
          <span className="qa-arrow">›</span>
        </div>
      </div>

      {/* AI Capability Cards */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">AI 能为你做什么</h2>
        </div>
        <div className="capability-cards">
          <div className="cap-card">
            <div className="cap-icon cap-icon--face">🪞</div>
            <h3 className="cap-title">AI 脸型分析</h3>
            <p className="cap-desc">识别脸型比例<br />分析五官特点</p>
          </div>
          <div className="cap-card">
            <div className="cap-icon cap-icon--color">🎨</div>
            <h3 className="cap-title">色彩分析</h3>
            <p className="cap-desc">匹配适合你的<br />色彩方向</p>
          </div>
          <div className="cap-card">
            <div className="cap-icon cap-icon--style">💄</div>
            <h3 className="cap-title">风格推荐</h3>
            <p className="cap-desc">找到你的专属<br />妆容风格</p>
          </div>
        </div>
      </div>

      {/* Upload Guide */}
      <div className="section">
        <div className="guide-card">
          <div className="guide-icon">📷</div>
          <h3 className="guide-title">只需简单三步</h3>
          <ul className="guide-steps">
            <li><span className="step-num">1</span> <span>上传一张清晰正脸照片</span></li>
            <li><span className="step-num">2</span> <span>AI 自动分析面部特征</span></li>
            <li><span className="step-num">3</span> <span>约30秒获得你的AI美学报告</span></li>
          </ul>
          <div className="privacy-badges">
            <span className="badge">✓ 不公开展示</span>
            <span className="badge">✓ 仅用于AI分析</span>
            <span className="badge">✓ 可随时删除</span>
          </div>
        </div>
      </div>

      {/* Report Levels */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">报告等级</h2>
          <p className="section-subtitle">从免费体验到专属美学方案</p>
        </div>
        <div className="level-list">
          <div className="level-item level-item--free">
            <div className="level-dot level-dot--free"></div>
            <div className="level-info">
              <span className="level-name">初见妆容</span>
              <span className="level-tag">免费体验</span>
            </div>
            <p className="level-desc">了解你的第一印象</p>
          </div>
          <div className="level-item">
            <div className="level-dot level-dot--mid"></div>
            <div className="level-info">
              <span className="level-name">风格进阶</span>
              <span className="level-tag">进阶分析</span>
            </div>
            <p className="level-desc">找到适合你的风格</p>
          </div>
          <div className="level-item level-item--pro">
            <div className="level-dot level-dot--pro"></div>
            <div className="level-info">
              <span className="level-name">专属美学</span>
              <span className="level-tag">私人定制</span>
            </div>
            <p className="level-desc">AI私人美妆方案</p>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <button className="nav-btn btn-center" onClick={handleTokenClick}>
          <span className="nav-icon">🎫</span>
          <span>Token</span>
        </button>
        <button className="nav-btn nav-btn--active" onClick={handleStartClick}>
          <span className="nav-icon">✨</span>
          <span>开始分析</span>
        </button>
        <button className="nav-btn btn-center" onClick={handleProfileClick}>
          <span className="nav-icon">👤</span>
          <span>我的</span>
        </button>
      </div>

      {/* Legal */}
      <div className="legal">
        <a onClick={handlePrivacyClick} className="legal-link">隐私政策</a>
        <a onClick={handleAgreementClick} className="legal-link">用户协议</a>
      </div>
    </div>
  );
};

export default Index;


