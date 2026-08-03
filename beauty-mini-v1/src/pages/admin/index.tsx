import React, { useState } from "react";
import "@/components/admin/styles.css";
import ReportLevelManage from "@/components/admin/ReportLevelManage";
import ContentPermissionManage from "@/components/admin/ContentPermissionManage";
import TokenConfigManage from "@/components/admin/TokenConfigManage";
import RecommendationConfigManage from "@/components/admin/RecommendationConfigManage";
import { navigate } from "@taro/router";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"report" | "permission" | "token" | "recommendation">("report");

  // Navigate back to home when needed
  const handleBack = () => {
    navigate({ url: "/pages/home" });
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button onClick={handleBack} style={{ cursor: "pointer", textDecoration: "underline", marginBottom: "10px" }}>← 返回</button>
        <h1>Admin 配置中心</h1>
        <p>运营配置管理</p>
      </header>

      <nav className="admin-nav">
        <button
          className={activeTab === "report" ? "active" : ""}
          onClick={() => setActiveTab("report")}
        >
          报告等级
        </button>
        <button
          className={activeTab === "permission" ? "active" : ""}
          onClick={() => setActiveTab("permission")}
        >
          内容权限
        </button>
        <button
          className={activeTab === "token" ? "active" : ""}
          onClick={() => setActiveTab("token")}
        >
          Token配置
        </button>
        <button
          className={activeTab === "recommendation" ? "active" : ""}
          onClick={() => setActiveTab("recommendation")}
        >
          推荐开关
        </button>
      </nav>

      <main className="admin-content">
        {activeTab === "report" && <ReportLevelManage />}
        {activeTab === "permission" && <ContentPermissionManage />}
        {activeTab === "token" && <TokenConfigManage />}
        {activeTab === "recommendation" && <RecommendationConfigManage />}
      </main>
    </div>
  );
};

export default AdminPage;
