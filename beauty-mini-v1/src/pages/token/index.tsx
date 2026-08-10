import React, { useState, useEffect } from "react";
import { navigate } from "@taro/router";
import { Button, Text, View } from '@tarojs/components';
import userService from "@/services/user-service";
import { fetchServerBalance } from "@/services/token";
import "./index.css";

const TokenPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBalance() {
      try {
        const userId = await userService.getCurrentUser().then(u => u.userId);
        const result = await fetchServerBalance(userId);
        if (result.success && result.balance !== undefined) {
          setBalance(result.balance);
        } else {
          setError(result.error || "获取余额失败");
        }
      } catch {
        setError("网络异常，请重试");
      } finally {
        setLoading(false);
      }
    }
    loadBalance();
  }, []);

  const handleExchange = () => {
    navigate({ url: "/pages/purchase" });
  };

  if (loading) {
    return (
      <View className="token-page">
        <View className="loading-state">
          <View className="loading-spinner"></View>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="token-page">
        <View className="error-state">
          <Text className="error-text">{error}</Text>
          <Button className="retry-btn" onClick={() => window.location.reload()}>重试</Button>
        </View>
      </View>
    );
  }

  return (
    <View className="token-page">
      <View className="token-container">
        <Text className="page-title">Token 账户</Text>
        <View className="balance-card">
          <Text className="balance-label">当前 Token 余额</Text>
          <Text className="balance-value">{balance !== null ? balance : "—"}</Text>
        </View>
        <Text className="page-subtitle">Token 用于解锁高级美妆报告，每日登录可获取免费 Token</Text>
        <Button className="exchange-btn btn-center" onClick={handleExchange}>购买报告</Button>
        <Text className="hint">购买后可解锁风格进阶或专属美学报告</Text>
      </View>
    </View>
  );
};

export default TokenPage;

