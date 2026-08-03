import React from "react";
import RecommendationCard from "./RecommendationCard";
import "./ProductRecommendation.css";

interface ProductMatchData {
  id: string;
  name: string;
  brand: string;
  category: "brow" | "eye" | "lip" | "skincare";
  image: string;
  price: number;
  matchScore: number;
  reason: string;
  purchaseUrl?: string;
}

interface ProductRecommendationProps {
  products: ProductMatchData[];
  onProductClick?: (product: ProductMatchData) => void;
}

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    "brow": "眉部",
    "eye": "眼部",
    "lip": "唇部",
    "skincare": "护肤"
  };
  return names[category] || category;
};

const formatPrice = (price: number): string => {
  return "￥" + price.toFixed(2);
};

const getProductCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    "brow": "#c8a2c8",
    "eye": "#d4a5a5",
    "lip": "#f8b4b4",
    "skincare": "#a5d4a5"
  };
  return colors[category] || "#667eea";
};

const renderProduct = (product: ProductMatchData, index: number, onProductClick?: (product: ProductMatchData) => void) => {
  const tags = [
    { category: product.category, label: getCategoryName(product.category) }
  ];

  const cardContent = (
    <div className="product-item" onClick={() => onProductClick?.(product)}>
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-brand">品牌：{product.brand}</div>
        <div className="product-category">
          <span className="category-badge" style={{ 
            backgroundColor: getProductCategoryColor(product.category) + "33",
            color: getProductCategoryColor(product.category)
          }}>
            {getCategoryName(product.category)}
          </span>
        </div>
        <div className="product-price">{formatPrice(product.price)}</div>
      </div>
    </div>
  );

  return (
    <div key={product.id} className="product-item-wrapper">
      <RecommendationCard
        title={product.name}
        matchScore={{ score: product.matchScore, label: "匹配度" }}
        tags={tags}
        reason={product.reason}
      >
        {cardContent}
      </RecommendationCard>
    </div>
  );
};

const ProductRecommendation = ({ products, onProductClick }: ProductRecommendationProps) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="product-recommendation">
      <h3 className="section-title">商品推荐</h3>
      {products.map((product, index) => renderProduct(product, index, onProductClick))}
    </div>
  );
};

export default ProductRecommendation;
