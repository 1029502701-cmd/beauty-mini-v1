import React, { useState, useEffect } from "react";
import tokenConfigManager from "@/admin/beauty/token-config/manager";
import type { ReportLevel } from "@/types/report-level";
import "@/components/admin/styles.css";

const TOKEN_LEVELS: ReportLevel[] = ["first-look", "style-upgrade", "beauty-pro"];

const TokenConfigManage: React.FC = () => {
  const [tokenConfigs, setTokenConfigs] = useState<Record<ReportLevel, number>>({});

  useEffect(() => {
    const allCosts = tokenConfigManager.getAllTokenCosts();
    const configs: Record<ReportLevel, number> = {};
    for (const level of TOKEN_LEVELS) {
      configs[level] = allCosts[level] || 0;
    }
    setTokenConfigs(configs);
  }, []);

  const updateTokenCost = (level: ReportLevel, cost: number) => {
    tokenConfigManager.updateTokenCost(level, cost);
    setTokenConfigs(prev => ({ ...prev, [level]: cost }));
  };

  const resetTokenCost = (level: ReportLevel) => {
    const defaultCost = tokenConfigManager.resetTokenCost(level);
    setTokenConfigs(prev => ({ ...prev, [level]: defaultCost }));
  };

  const handleInputChange = (level: ReportLevel, e: React.ChangeEvent<HTMLInputElement>) => {
    const cost = parseInt(e.target.value) || 0;
    updateTokenCost(level, cost);
  };

  const handleResetClick = (e: React.MouseEvent, level: ReportLevel) => {
    e.stopPropagation();
    resetTokenCost(level);
  };

  return (
    <div className="admin-container">
      <h2>Token配置</h2>
      <div className="token-config-list">
        {TOKEN_LEVELS.map(level => (
          <div key={level} className="token-config-item">
            <div className="token-config-label">
              {getLevelName(level)}
              <button className="reset-btn" onClick={(e) => handleResetClick(e, level)}>重置</button>
            </div>
            <input
              type="number"
              value={tokenConfigs[level] || ""}
              onChange={(e) => handleInputChange(level, e)}
              className="token-input"
            />
            <span className="token-unit">Token</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: "20px", color: "#666" }}>
        说明：免费等级（初见妆容、风格进阶）Token消耗为0；美颜专业版默认消耗3 Token，可根据运营策略调整。
      </p>
    </div>
  );
};

function getLevelName(level: ReportLevel): string {
  const names: Record<ReportLevel, string> = {
    "first-look": "初见妆容",
    "style-upgrade": "风格进阶",
    "beauty-pro": "美颜专业版",
  };
  return names[level] || level;
}

export default TokenConfigManage;
