import React, { useState, useEffect } from "react";
import { Button, Text, View } from '@tarojs/components';
import "./index.css";
import { navigate } from "@taro/router";
import userService from "../../services/user-service";

const Index = () => {
  const [remainingCount, setRemainingCount] = useState(2);

  useEffect(() => {
    async function loadCounts() {
      try {
        const user = await userService.getCurrentUser();
        const { getUserQuota } = await import("../../services/token");
        const quota = getUserQuota(user.userId);
        // Count reports created today from local storage
        const { getStorage } = await import("../../utils/storage");
        const reports = getStorage<Array<{ createdAt: string }>>("beauty_reports_list", []) ?? [];
        const today = new Date().toDateString();
        const todayCount = reports.filter((r) => new Date(r.createdAt).toDateString() === today).length;
        setRemainingCount(Math.max(0, quota.freeCount - todayCount));
      } catch {
        // Use defaults
      }
    }
    loadCounts();
  }, []);

  const handleStartClick = () => {
    navigate({ url: "/pages/upload/index" });
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
    <View className="home-page">
      {/* Hero Section */}
      <View className="hero">
        <View className="hero-glow"></View>
        <View className="hero-content">
          <View className="hero-badge">AI 美学顾问</View>
          <Text className="hero-title">发现属于你的美</Text>
          <Text className="hero-subtitle">
            AI 分析你的脸型 · 五官 · 肤色 · 风格
          </Text>
          <Text className="hero-tagline">生成你的专属美妆建议</Text>
        </View>
      </View>

      {/* Three Capability Cards */}
      <View className="section cards-section">
        <View className="capability-cards">
          <View className="cap-card">
            <View className="cap-icon cap-icon--face">🔍</View>
            <Text className="cap-title">AI 识别你的脸型特点</Text>
          </View>
          <View className="cap-card">
            <View className="cap-icon cap-icon--style">💄</View>
            <Text className="cap-title">找到适合你的妆容风格</Text>
          </View>
          <View className="cap-card">
            <View className="cap-icon cap-icon--color">✨</View>
            <Text className="cap-title">生成专属美学建议</Text>
          </View>
        </View>
      </View>

      {/* Quick Access - My Reports */}
      <View className="section">
        <View className="quick-access-card" onClick={handleReportsClick}>
          <View className="qa-icon">📊</View>
          <View className="qa-content">
            <Text className="qa-title">我的报告</Text>
            <Text className="qa-desc">查看历史分析记录</Text>
          </View>
          <Text className="qa-arrow">›</Text>
        </View>
      </View>

      {/* Today Count */}
      <View className="section">
        <View className="today-count-card">
          <View className="today-count-icon">🎯</View>
          <View className="today-count-info">
            <Text className="today-count-label">今日分析次数</Text>
            <Text className="today-count-value">
              {remainingCount} / 2 次免费
            </Text>
          </View>
        </View>
      </View>

      {/* Main CTA Button */}
      <View className="section cta-section">
        <Button className="hero-cta btn-center" onClick={handleStartClick}>
          <Text className="cta-icon">✓</Text>
          开始 AI 分析
        </Button>
      </View>

      {/* Bottom Nav */}
      <View className="bottom-nav">
        <Button className="nav-btn btn-center" onClick={handleTokenClick}>
          <Text className="nav-icon">🎫</Text>
          <Text>Token</Text>
        </Button>
        <Button className="nav-btn nav-btn--active" onClick={handleStartClick}>
          <Text className="nav-icon">✓</Text>
          <Text>开始分析</Text>
        </Button>
        <Button className="nav-btn btn-center" onClick={handleProfileClick}>
          <Text className="nav-icon">👤</Text>
          <Text>我的</Text>
        </Button>
      </View>

      {/* Legal */}
      <View className="legal">
        <Text onClick={handlePrivacyClick} className="legal-link">隐私政策</Text>
        <Text onClick={handleAgreementClick} className="legal-link">用户协议</Text>
      </View>
    </View>
  );
};

export default Index;
