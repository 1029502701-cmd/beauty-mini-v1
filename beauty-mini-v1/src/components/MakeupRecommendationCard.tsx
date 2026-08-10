import React from "react";
import "./MakeupRecommendationCard.css";

interface MakeupRecommendationCardProps { 
  makeupStyle: string; 
  description: string;
  onStyleClick?: () => void;
}

const MakeupRecommendationCard = ({ makeupStyle, description, onStyleClick }: MakeupRecommendationCardProps) => {
  const handleClick = () => {
    onStyleClick?.();
  };

  return (
    <div className="makeup-recommendation-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="card-header"><h3>推荐妆容</h3></div>
      <div className="makeup-card-content">
        <div className="makeup-style-name">{makeupStyle}</div>
        <div className="makeup-description">{description}</div>
      </div>
    </div>
  );
};
export default MakeupRecommendationCard;
