import React from "react";

interface BeautyCardProps {
  title: string;
  description: string;
  imageUrl?: string;
}

const BeautyCard = ({ title, description, imageUrl }: BeautyCardProps) => {
  return (
    <div className="beauty-card">
      {imageUrl && <img src={imageUrl} alt={title} />}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default BeautyCard;
