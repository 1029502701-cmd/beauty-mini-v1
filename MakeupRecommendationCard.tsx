import React from "react";
import "./MakeupRecommendationCard.css";

interface MakeupRecommendationCardProps {
  makeupStyle: string;
  description: string;
}
const MakeupRecommendationCard = ({ makeupStyle, description }: MakeupRecommendationCardProps) => {
  return (
    <div className="makeup-recommendation-card">
      <div className="card-header"><h3>ÍÆ¼ö×±ÈÝ</h3></div>
      <div className="makeup-card-content">
        <div className="makeup-style-name">{makeupStyle}</div>
        <div className="makeup-description">{description}</div>
      </div>
    </div>
  );
};
export default MakeupRecommendationCard;
