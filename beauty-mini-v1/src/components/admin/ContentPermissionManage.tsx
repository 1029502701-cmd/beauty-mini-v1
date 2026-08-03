import React, { useState, useEffect } from "react";
import contentPermissionManager from "@/admin/beauty/permission-config/manager";
import type { ReportAccessLevel, ReportContentModule } from "@/types";
import "@/components/admin/styles.css";

const CONTENT_MODULES: ReportContentModule[] = [
  "faceAnalysis",
  "makeupStyle",
  "colorAnalysis",
  "makeupSuggestion",
  "productRecommendation",
  "kolRecommendation",
  "beautyPlan",
];

const LEVELS: ReportAccessLevel[] = ["first-look", "style-upgrade", "beauty-pro"];

const ContentPermissionManage: React.FC = () => {
  const [permissions, setPermissions] = useState<Record<ReportAccessLevel, Record<ReportContentModule, boolean>>>({});
  const [activeLevel, setActiveLevel] = useState<ReportAccessLevel | null>(null);

  useEffect(() => {
    const allPerms = contentPermissionManager.getAllPermissions();
    const normalized: Record<ReportAccessLevel, Record<ReportContentModule, boolean>> = {};
    for (const level of LEVELS) {
      normalized[level] = {};
      for (const module of CONTENT_MODULES) {
        normalized[level][module] = allPerms[level]?.[module] || false;
      }
    }
    setPermissions(normalized);
    if (LEVELS.length > 0) {
      setActiveLevel(LEVELS[0]);
    }
  }, []);

  const setModulePermission = (level: ReportAccessLevel, module: ReportContentModule, enabled: boolean) => {
    contentPermissionManager.setModulePermission(level, module, enabled);
    setPermissions(prev => ({
      ...prev,
      [level]: { ...prev[level], [module]: enabled },
    }));
  };

  const resetLevel = (level: ReportAccessLevel) => {
    contentPermissionManager.resetLevelToDefault(level);
    setPermissions(prev => {
      const newLevel = { ...prev[level] };
      for (const module of CONTENT_MODULES) {
        delete newLevel[module];
      }
      return { ...prev, [level]: newLevel };
    });
  };

  if (!activeLevel) {
    return <div className="admin-container">请选择一个等级</div>;
  }

  return (
    <div className="admin-container">
      <h2>内容权限管理</h2>
      <div className="level-selector">
        {LEVELS.map(level => (
          <button
            key={level}
            className={`level-btn ${activeLevel === level ? "active" : ""}`}
            onClick={() => setActiveLevel(level)}
          >
            {getLevelName(level)}
          </button>
        ))}
        <button className="reset-btn" onClick={() => resetLevel(activeLevel)}>
          重置为默认
        </button>
      </div>
      <div className="permission-grid">
        <div className="module-header">
          <div>模块</div>
          {CONTENT_MODULES.map(module => (
            <div key={module}>{getModuleName(module)}</div>
          ))}
        </div>
        {CONTENT_MODULES.map(module => (
          <div key={module} className="permission-row">
            <span>{getModuleName(module)}</span>
            {CONTENT_MODULES.map(mod => (
              <label key={mod} className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={permissions[activeLevel][mod]}
                  onChange={() => setModulePermission(activeLevel, mod, !permissions[activeLevel][mod])}
                />
                <span className="checkmark"></span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

function getLevelName(level: ReportAccessLevel): string {
  const names: Record<ReportAccessLevel, string> = {
    "first-look": "初见妆容",
    "style-upgrade": "风格进阶",
    "beauty-pro": "美颜专业版",
  };
  return names[level] || level;
}

function getModuleName(module: ReportContentModule): string {
  const names: Record<ReportContentModule, string> = {
    faceAnalysis: "面部分析",
    makeupStyle: "化妆风格",
    colorAnalysis: "色彩分析",
    makeupSuggestion:"妆容建议",
    productRecommendation: "产品推荐",
    kolRecommendation: "KOL推荐",
    beautyPlan: "美妆计划",
  };
  return names[module] || module;
}

export default ContentPermissionManage;
