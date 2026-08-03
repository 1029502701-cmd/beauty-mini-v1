import React, { useState, useEffect } from "react";
import { navigate } from "@taro/router";
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
      <div className="token-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="token-page">
        <div className="error-state">
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="token-page">
      <div className="token-container">
        <h2 className="page-title">Token 账户</h2>
        <div className="balance-card">
          <p className="balance-label">当前 Token 余额</p>
          <p className="balance-value">{balance !== null ? balance : "—"}</p>
        </div>
        <p className="page-subtitle">Token 用于解锁高级美妆报告，每日登录可获取免费 Token</p>
        <button className="exchange-btn btn-center" onClick={handleExchange}>购买报告</button>
        <p className="hint">购买后可解锁风格进阶或专属美学报告</p>
      </div>
    </div>
  );
};

export default TokenPage;

