import React from "react";
import "./ProductCard.css";
import type { BeautyProduct } from "@/types";

interface ProductCardProps {
  products: BeautyProduct[];
}

const ProductCard = ({ products }: ProductCardProps) => {
  const getCategoryName = (category: string): string => {
    switch (category) {
      case "brow": return "眉部";
      case "eye": return "眼部";
      case "lip": return "唇部";
      case "skincare": return "护肤";
      default: return category;
    }
  };

  const formatPrice = (price: number): string => {
    return "￥" + price.toFixed(2);
  };

  return (
    <div className="product-card">
      <h3 className="card-title">精选推荐</h3>
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            {product.image && (
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
            )}
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-brand">品牌：{product.brand}</div>
              <div className="product-category">分类：{getCategoryName(product.category)}</div>
              <div className="product-price">{formatPrice(product.price)}</div>
              <div className="product-match-reason">
                <span className="reason-label">匹配原因：</span>
                <span className="reason-value">{product.reason}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCard;
