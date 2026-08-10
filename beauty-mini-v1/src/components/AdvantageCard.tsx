import React from "react";
import "./AdvantageCard.css";

interface AdvantageProps {
  title: string;
  advantages: string[];
}

const AdvantageCard = ({ title, advantages }: AdvantageProps) => {
  return (
    <div className="advantage-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="advantages-list">
        {advantages.map((adv, index) => (
          <div key={index} className="advantage-item">
            <span className="advantage-icon">✓</span>
            <span className="advantage-text">{adv}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvantageCard;
