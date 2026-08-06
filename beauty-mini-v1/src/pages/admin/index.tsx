import React, { useState } from "react";
import { Button, Text, View } from '@tarojs/components';
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
    <View className="admin-page">
      <View className="admin-header">
        <Button onClick={handleBack} style={{ cursor: "pointer", textDecoration: "underline", marginBottom: "10px" }}>�� ����</Button>
        <Text>Admin ��������</Text>
        <Text>��Ӫ���ù���</Text>
      </View>

      <View className="admin-nav">
        <Button
          className={activeTab === "report" ? "active" : ""}
          onClick={() => setActiveTab("report")}
        >
          ����ȼ�
        </Button>
        <Button
          className={activeTab === "permission" ? "active" : ""}
          onClick={() => setActiveTab("permission")}
        >
          ����Ȩ��
        </Button>
        <Button
          className={activeTab === "token" ? "active" : ""}
          onClick={() => setActiveTab("token")}
        >
          Token����
        </Button>
        <Button
          className={activeTab === "recommendation" ? "active" : ""}
          onClick={() => setActiveTab("recommendation")}
        >
          �Ƽ�����
        </Button>
      </View>

      <View className="admin-content">
        {activeTab === "report" && <ReportLevelManage />}
        {activeTab === "permission" && <ContentPermissionManage />}
        {activeTab === "token" && <TokenConfigManage />}
        {activeTab === "recommendation" && <RecommendationConfigManage />}
      </View>
    </View>
  );
};

export default AdminPage;
