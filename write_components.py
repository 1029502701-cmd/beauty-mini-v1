import base64
base = r'C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\components\ui'
import os
os.makedirs(base, exist_ok=True)

confirm_modal = """import React from "react";
import "./ConfirmModal.css";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open, title, message, confirmText = "确认", cancelText = "取消",
  variant = "default", onConfirm, onCancel,
}) => {
  if (!open) return null;
  return (
    <>
      <div className="modal-overlay" onClick={onCancel} />
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="关闭">&#10005;</button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onCancel}>{cancelText}</button>
          <button
            className={modal-btn confirm}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
"""

with open(base + r'\ConfirmModal.tsx', 'w', encoding='utf-8') as f:
    f.write(confirm_modal)
print('ConfirmModal.tsx written')
