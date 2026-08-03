import React, { useState, useEffect } from "react";
import recommendationConfig from "@/admin/beauty/recommendation-config/config";
import type { ReportContentModule } from "@/types";
import "@/components/admin/styles.css";

const RECOMMENDATION_MODULES: ReportContentModule[] = [
  "productRecommendation",
  "kolRecommendation",
];

const RecommendationConfigManage: React.FC = () => {
  const [recConfigs, setRecConfigs] = useState<Record<ReportContentModule, boolean>>({});

  useEffect(() => {
    const allRec = recommendationConfig.getAll();
    const configs: Record<ReportContentModule, boolean> = {
      productRecommendation: allRec.productRecommendation !== undefined ? allRec.productRecommendation : true,
      kolRecommendation: allRec.kolRecommendation !== undefined ? allRec.kolRecommendation : true,
    };
    setRecConfigs(configs);
  }, []);

  const toggleRecommendation = (module: ReportContentModule, enabled: boolean) => {
    recommendationConfig.setEnabled(module, enabled);
    setRecConfigs(prev => ({ ...prev, [module]: enabled }));
  };

  const resetAll = () => {
    RECOMMENDATION_MODULES.forEach(module => recommendationConfig.reset(module));
    setRecConfigs({ productRecommendation: true, kolRecommendation: true });
  };

  return (
    <div className="admin-container">
      <h2>推荐模块开关</h2>
      <div className="recommendation-list">
        {RECOMMENDATION_MODULES.map(module => (
          <div key={module} className="recommendation-item">
            <span>{getModuleName(module)}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={recConfigs[module]}
                onChange={() => toggleRecommendation(module, !recConfigs[module])}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>
      <button className="reset-btn" onClick={resetAll}>全部重置为默认</button>
      <p style={{ marginTop: "20px", color: "#666" }}>
        说明：即使关闭推荐开关，用户仍可通过权限配置获得相应内容的访问权限，但前端将不展示推荐模块。
      </p>
    </div>
  );
};

function getModuleName(module: ReportContentModule): string {
  const names: Record<ReportContentModule, string> = {
    productRecommendation: "产品推荐",
    kolRecommendation: "KOL推荐",
  };
  return names[module] || module;
}

export default RecommendationConfigManage;
