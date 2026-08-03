import React, { useState, useEffect } from "react";
import reportLevelManager from "@/admin/beauty/report-config/manager";
import type { ReportLevel, ReportLevelConfig } from "@/types/report-level";
import "@/components/admin/styles.css";

const ReportLevelManage: React.FC = () => {
  const [levels, setLevels] = useState<Record<ReportLevel, ReportLevelConfig>>({});
  const [activeLevel, setActiveLevel] = useState<ReportLevel | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReportLevelConfig>>({});

  useEffect(() => {
    const allLevels = reportLevelManager.getAllLevels();
    setLevels(allLevels);
    const firstLevel = Object.keys(allLevels)[0] as ReportLevel | null;
    setActiveLevel(firstLevel);
    if (firstLevel) {
      setEditForm({ ...allLevels[firstLevel] });
    }
  }, []);

  const updateLevel = () => {
    if (!activeLevel) return;
    reportLevelManager.updateLevel({ level: activeLevel, ...editForm });
    const updated = { ...levels };
    updated[activeLevel] = { ...updated[activeLevel], ...editForm };
    setLevels(updated);
    alert("配置已更新！");
  };

  const enableLevel = () => {
    if (!activeLevel) return;
    reportLevelManager.enableLevel(activeLevel);
    const updated = { ...levels };
    updated[activeLevel].enabled = true;
    setLevels(updated);
    alert("已启用！");
  };

  const disableLevel = () => {
    if (!activeLevel) return;
    reportLevelManager.disableLevel(activeLevel);
    const updated = { ...levels };
    updated[activeLevel].enabled = false;
    setLevels(updated);
    alert("已禁用！");
  };

  if (!activeLevel) {
    return <div className="admin-container">请选择一个报告等级</div>;
  }

  const currentLevel = levels[activeLevel];

  return (
    <div className="admin-container">
      <h2>报告等级管理</h2>
      <div className="level-selector">
        {Object.entries(levels).map(([level, config]) => (
          <button
            key={level}
            className={`level-btn ${activeLevel === level ? "active" : ""}`}
            onClick={() => {
              setActiveLevel(level as ReportLevel);
              setEditForm({ ...config });
            }}
          >
            {config.name}
          </button>
        ))}
      </div>
      <div className="level-detail">
        <div className="form-group">
          <label>名称：</label>
          <input
            type="text"
            value={editForm.name || ""}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>价格（分）：</label>
          <input
            type="number"
            value={editForm.price !== undefined ? editForm.price : ""}
            onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Token消耗：</label>
          <input
            type="number"
            value={editForm.tokenCost !== undefined ? editForm.tokenCost : ""}
            onChange={(e) => setEditForm({ ...editForm, tokenCost: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>保存天数：</label>
          <input
            type="number"
            value={editForm.expireDays !== undefined ? editForm.expireDays : ""}
            onChange={(e) => setEditForm({ ...editForm, expireDays: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>启用状态：</label>
          <button
            onClick={() => {
              setEditForm({ ...editForm, enabled: !currentLevel.enabled });
              enableLevel();
            }}
            className={currentLevel.enabled ? "enable-btn" : "disable-btn"}
          >
            {currentLevel.enabled ? "已启用" : "已禁用"}
          </button>
        </div>
        <div className="action-buttons">
          <button className="save-btn" onClick={updateLevel}>保存修改</button>
          <button
            className="toggle-btn"
            onClick={currentLevel.enabled ? disableLevel : enableLevel}
          >
            {currentLevel.enabled ? "禁用等级" : "启用等级"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportLevelManage;
