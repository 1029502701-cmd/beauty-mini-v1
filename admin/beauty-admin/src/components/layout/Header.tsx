import React from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";
import { ADMIN_MENU_CONFIG } from "@/types";

const Header: React.FC = () => {
  const location = useLocation();
  const route = ADMIN_MENU_CONFIG.find((m) => m.path === location.pathname);
  const title = route?.label || "运营概览";

  const stored = localStorage.getItem("admin_session");
  let roleLabel = "operator";
  try {
    const session = JSON.parse(stored || "{}") as { role: string };
    roleLabel = session.role || "operator";
  } catch {}

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    window.location.reload();
  };

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        <span className="header-role-badge">{roleLabel}</span>
        <button className="header-logout-btn" onClick={handleLogout}>
          退出登录
        </button>
      </div>
    </header>
  );
};

export default Header;