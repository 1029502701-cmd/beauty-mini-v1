import React from "react";
import "./ProductPopup.css";

interface ProductPopupData {
  id: string;
  name: string;
  brand: string;
  image: string;
  matchScore: number;
  reason: string;
  purchaseUrl?: string;
}

interface ProductPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPopupData;
}

const ProductPopup = ({ isOpen, onClose, product }: ProductPopupProps) => {
  if (!isOpen) return null;

  const renderMatchScoreColor = (score: number) => {
    if (score >= 90) return "#28a745";
    if (score >= 75) return "#ffc107";
    if (score >= 60) return "#667eea";
    return "#dc3545";
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="product-popup-overlay" onClick={handleBackdropClick}>
      <div className="product-popup-content">
        <button className="popup-close-btn" onClick={onClose}>×</button>
        
        <div className="popup-header">
          <h2 className="popup-title">商品详情</h2>
        </div>
        
        <div className="popup-body">
          <div className="product-detail">
            <div className="product-image">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-brand">品牌：{product.brand}</div>
              <div className="product-match">
                <span className="match-label">AI匹配度：</span>
                <span className="match-score" style={{ color: renderMatchScoreColor(product.matchScore) }}>
                  {product.matchScore.toFixed(1)}分
                </span>
              </div>
              <div className="product-reason">
                <span className="reason-label">推荐理由：</span>
                <span className="reason-value">{product.reason}</span>
              </div>
            </div>
          </div>
          
          <div className="product-actions">
            {product.purchaseUrl ? (
              <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer" className="buy-btn">
                立即购买
              </a>
            ) : (
              <button className="buy-btn" disabled>
                购买入口（待接入）
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPopup;