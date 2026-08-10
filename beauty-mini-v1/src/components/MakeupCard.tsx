import React from "react";
import "./MakeupCard.css";

interface MakeupCardProps {
  makeupStyle: string;
  description: string;
  imageUrl?: string;
}

const MakeupCard = ({ makeupStyle, description, imageUrl }: MakeupCardProps) => {
  return (
    <div className="makeup-card">
      {imageUrl && (
        <div className="makeup-image">
          <img src={imageUrl} alt={makeupStyle} />
        </div>
      )}
      <div className="makeup-content">
        <h3 className="makeup-style">{makeupStyle}</h3>
        <p className="makeup-description">{description}</p>
      </div>
    </div>
  );
};

export default MakeupCard;
