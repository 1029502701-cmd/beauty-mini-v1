import React from "react";
import "./ProductCard.css";
import type { BeautyProduct } from "@/types";

interface ProductCardProps {
  products: BeautyProduct[];
}

const ProductCard = ({ products }: ProductCardProps) => {
  const getCategoryName = (category: string): string => {
    switch (category) {
      case "brow": return "ü��";
      case "eye": return "�۲�";
      case "lip": return "����";
      case "skincare": return "����";
      default: return category;
    }
  };

  const formatPrice = (price: number): string => {
    return "��" + price.toFixed(2);
  };

  return (
    <View className="product-card">
      <Text className="card-title">��ѡ�Ƽ�</Text>
      <View className="products-grid">
        {products.map((product) => (
          <View key={product.id} className="product-item">
            {product.image && (
              <View className="product-image">
                <img src={product.image} alt={product.name} />
              </View>
            )}
            <View className="product-info">
              <View className="product-name">{product.name}</View>
              <View className="product-brand">Ʒ�ƣ�{product.brand}</View>
              <View className="product-category">���ࣺ{getCategoryName(product.category)}</View>
              <View className="product-price">{formatPrice(product.price)}</View>
              <View className="product-match-reason">
                <Text className="reason-label">ƥ��ԭ��</Text>
                <Text className="reason-value">{product.reason}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProductCard;
