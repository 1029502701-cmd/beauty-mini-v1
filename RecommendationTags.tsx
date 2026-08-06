import React from "react";
import "./RecommendationTags.css";

interface TagProps {
  category: "brow" | "eye" | "lip";
  label: string;
  description: string;
}

interface RecommendationTagsProps {
  tags: TagProps[];
}

const RecommendationTags = ({ tags }: RecommendationTagsProps) => {
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "brow": return "? ÍÆ¼öÃ¼ÐÎ";
      case "eye": return "? ÍÆ¼öÑÛ×±";
      case "lip": return "? ÍÆ¼ö´½É«";
      default: return "";
    }
  };

  return (
    <div className="recommendation-tags">
      <h3>? ×±ÈÝ´îÅä</h3>
      <div className="tags-list">
        {tags.map((tag, index) => (
          <div key={index} className="tag-item">
            <span className="tag-icon">{getCategoryIcon(tag.category)}</span>
            <div className="tag-content">
              <div className="tag-label">{tag.label}</div>
              <div className="tag-desc">{tag.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationTags;
