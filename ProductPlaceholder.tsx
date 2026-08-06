import React from "react";
import "./ProductPlaceholder.css";

interface ProductRecommendation {
  id: string;
  name: string;
  category: "brow" | "eye" | "lip" | "skincare";
  reason: string;
}

interface ProductPlaceholderProps {
  products: ProductRecommendation[];
}

const ProductPlaceholder = ({ products }: ProductPlaceholderProps) => {
  const getCategoryName = (category: string) => {
    switch(category) {
      case "brow": return "眉部";
      case "eye": return "眼部";
      case "lip": return "唇部";
      case "skincare": return "护肤";
      default: return category;
    }
  };

  return (
    <div className="product-placeholder">
      <h3>搭配推荐</h3>
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-category">{getCategoryName(product.category)}</div>
              <div className="product-reason">{product.reason}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="note">商品推荐功能将在V2版本上线（暂不支持支付和商城）</p>
    </div>
  );
};

export default ProductPlaceholder;
