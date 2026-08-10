import React from "react";
import "./ProductCard.css";
import type { ProductRecommendation } from "@/types/beauty";

interface ProductCardProps {
  product: ProductRecommendation;
  onClick?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  brow: "眉部",
  eye: "眼部",
  lip: "唇部",
  skincare: "护肤"
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "重点推荐",
  medium: "可选",
  low: "补充"
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const categoryLabel = CATEGORY_LABELS[product.category] || product.productType;
  const priorityLabel = PRIORITY_LABELS[product.priority] || "可选";
  const priorityColor = product.priority === "high" ? "#e91e63" : product.priority === "medium" ? "#ff9800" : "#9e9e9e";

  return (
    <div className="product-card" style={{ borderLeftColor: priorityColor }} onClick={onClick}>
      <div className="product-header">
        <div className="product-meta">
          <span className="product-category">{categoryLabel}</span>
          <span className="product-priority" style={{ color: priorityColor }}>{priorityLabel}</span>
        </div>
        {product.priorityScene && (
          <span className="product-scene">{product.priorityScene}</span>
        )}
      </div>
      <div className="product-name">{product.name}</div>
      <div className="product-brand">{product.brand}</div>
      <div className="product-reason">{product.reason}</div>
      {product.recommendedTags && product.recommendedTags.length > 0 && (
        <div className="product-tags">
          {product.recommendedTags.map((tag, i) => (
            <span key={i} className="product-tag">{tag}</span>
          ))}
        </div>
      )}
      <div className="product-hint">点击查看详情 ›</div>
    </div>
  );
};

export default ProductCard;