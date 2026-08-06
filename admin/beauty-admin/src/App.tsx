import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@components/layout/Layout";
import Dashboard from "@pages/dashboard/Dashboard";
import AdminAuthGuard from "@guard/AdminAuthGuard";
import UsersPage from "@pages/users/UsersPage";
import ReportsPage from "@pages/reports/ReportsPage";
import TasksPage from "@pages/tasks/TasksPage";
import CreatorsPage from "@pages/creators/CreatorsPage";
import ProductsPage from "@pages/products/ProductsPage";
import ContentPage from "@pages/content/ContentPage";
import TokensPage from "@pages/tokens/TokensPage";
import SettingsPage from "@pages/settings/SettingsPage";
import OperationLogsPage from "@pages/logs/OperationLogsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin" element={<Layout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminAuthGuard><Dashboard /></AdminAuthGuard>} />
        <Route path="users" element={<AdminAuthGuard><UsersPage /></AdminAuthGuard>} />
        <Route path="reports" element={<AdminAuthGuard><ReportsPage /></AdminAuthGuard>} />
        <Route path="tasks" element={<AdminAuthGuard><TasksPage /></AdminAuthGuard>} />
        <Route path="creators" element={<AdminAuthGuard><CreatorsPage /></AdminAuthGuard>} />
        <Route path="products" element={<AdminAuthGuard><ProductsPage /></AdminAuthGuard>} />
        <Route path="content" element={<AdminAuthGuard><ContentPage /></AdminAuthGuard>} />
        <Route path="tokens" element={<AdminAuthGuard><TokensPage /></AdminAuthGuard>} />
        <Route path="settings" element={<AdminAuthGuard><SettingsPage /></AdminAuthGuard>} />
        <Route path="logs" element={<AdminAuthGuard><OperationLogsPage /></AdminAuthGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default App;