import React from "react";
import { navigate } from "@taro/router";
import { Button, Text, View } from '@tarojs/components';
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
    price: "1 Token",
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
    <View className="purchase-page">
      <View className="purchase-header">
        <Button className="back-btn btn-center" onClick={handleBack}>‹</Button>
        <Text className="page-title">购买报告</Text>
        <View className="header-spacer" />
      </View>

      <View className="purchase-body">
        <Text className="page-desc">选择适合的报告等级，解锁更多AI美学分析内容</Text>

        <View className="level-cards">
          {LEVELS.map((level) => (
            <View key={level.id} className={"level-card" + (level.recommended ? " recommended" : "")}>
              {level.recommended && <Text className="recommended-badge">推荐</Text>}
              <View className="level-card-header">
                <Text className="level-card-icon">{level.icon}</Text>
                <View className="level-card-info">
                  <Text className="level-card-name">{level.name}</Text>
                  <Text className="level-card-tag">{level.tag}</Text>
                </View>
              </View>
              <Text className="level-card-desc">{level.desc}</Text>
              <View className="level-features">
                {level.features.map((f) => (
                  <Text key={f}>✓ {f}</Text>
                ))}
              </View>
              <View className="level-card-price">{level.price}</View>
              <Button
                className="buy-btn"
                onClick={() => handleBuy(level.id)}
                disabled={level.current}
              >
                {level.current ? "当前等级" : "立即购买"}
              </Button>
            </View>
          ))}
        </View>

        <View className="purchase-note">
          <Text>💡 提示：Token 将在解锁后自动扣减，报告数据保留对应等级有效期。</Text>
        </View>
      </View>
    </View>
  );
};

export default Index;

