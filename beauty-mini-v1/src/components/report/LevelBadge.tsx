import React from "react";
import "./LevelBadge.css";
import { ReportLevel } from "@/types/report-level";

interface LevelBadgeProps {
  level: ReportLevel;
  levelName: string;
}

const LEVEL_CONFIG: Record<ReportLevel, { color: string; bg: string; border: string; icon: string; glow?: string }> = {
  "first-look": {
    color: "#888",
    bg: "linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)",
    border: "#ddd",
    icon: "🌱",
  },
  "style-upgrade": {
    color: "#7c4dff",
    bg: "linear-gradient(135deg, #f3eeff 0%, #ede7f6 100%)",
    border: "#ce93d8",
    icon: "🌿",
  },
  "beauty-pro": {
    color: "#c8a2c8",
    bg: "linear-gradient(135deg, #fdf4ff 0%, #fce4ec 100%)",
    border: "#e1bee7",
    icon: "👑",
    glow: "0 0 12px rgba(200,162,200,0.3)",
  },
};

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, levelName }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG["first-look"];
  return (
    <div className="level-badge" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color, boxShadow: cfg.glow }}>
      <span className="level-icon">{cfg.icon}</span>
      <span className="level-name">{levelName}</span>
    </div>
  );
};

export default LevelBadge;
