import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { ADMIN_MENU_CONFIG } from "@/types";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">💄</span>
        <span className="sidebar-logo-text">AI 美妆运营中心</span>
      </div>
      <nav className="sidebar-nav">
        {ADMIN_MENU_CONFIG.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item${isActive ? " active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;