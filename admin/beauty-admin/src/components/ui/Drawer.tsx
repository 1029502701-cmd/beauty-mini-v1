import React from "react";
import "./Drawer.css";

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

const Drawer: React.FC<DrawerProps> = ({ open, title, onClose, children, width = "480px" }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" style={{ width }}>
        <div className="drawer-header">
          <h3 className="drawer-title">{title}</h3>
          <button className="drawer-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  );
};

export default Drawer;