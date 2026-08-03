import React from "react";
import "./TagCloud.css";

interface TagCloudProps {
  tags: Array<{ category: string; label: string; description: string }>;
}

const TagCloud = ({ tags }: TagCloudProps) => {
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'brow': return '#9C27B0';
      case 'eye': return '#FF9800';
      case 'lip': return '#F44336';
      default: return '#667eea';
    }
  };

  return (
    <div className="tag-cloud">
      <h3 className="cloud-title">推荐搭配</h3>
      <div className="tags-container">
        {tags.map((tag, index) => (
          <div key={index} className="tag-item">
            <span 
              className="tag-category"
              style={{ color: getCategoryColor(tag.category) }}
            >
              {tag.category === 'brow' ? '眉形' : tag.category === 'eye' ? '眼妆' : '唇色'}
            </span>
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

export default TagCloud;
